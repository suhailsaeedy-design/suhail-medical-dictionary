from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
try:
    import yaml
except Exception:
    yaml=None
root=Path(__file__).resolve().parent
errors=[]; notes=[]
required=['app.html','ai.html','assets/css/clinical-reference.css','assets/js/clinical-reference.js','data/clinical-reference.json','data/clinical-calculators.json','verify_phase1.py','verify_phase2.py','verify_phase3.py','verify_phase4.py','sw.js','version.json','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
idx=load('data/index.json'); meta=load('data/clinical-reference.json'); calc=load('data/clinical-calculators.json'); ver=load('version.json')

try:
    vv=[int(x) for x in str(ver.get('version','0.0.0')).split('.')]
    if vv[0]!=21 or (vv[1],vv[2])<(3,0): errors.append('version.json should be v21.3.0 or later')
except Exception: errors.append('version.json invalid semantic version')
terms=idx.get('terms',[])
counts={m:sum(1 for t in terms if t.get('reference_module')==m) for m in ['conditions','procedures','drugs']}
expected={'conditions':185,'procedures':135,'drugs':87}
if counts!=expected:errors.append(f'Clinical Reference counts mismatch: {counts}')
if meta.get('counts',{}).get('conditions')!=185 or meta.get('counts',{}).get('procedures')!=135 or meta.get('counts',{}).get('drugs')!=87:errors.append('clinical-reference metadata counts mismatch')
calcs=calc.get('calculators',[])
if len(calcs)!=7:errors.append(f'expected 7 calculators, got {len(calcs)}')
ids=[c.get('id') for c in calcs]
if len(set(ids))!=7:errors.append('calculator IDs not unique')
for c in calcs:
    for k in ['id','title','group','formula','formula_label','inputs','output_unit']:
        if not c.get(k):errors.append(f'calculator {c.get("id")} missing {k}')
# module integrity
mods={m.get('id') for m in meta.get('modules',[])}
for m in ['conditions','procedures','drugs','calculators','interactions','learning']:
    if m not in mods:errors.append(f'missing Clinical Reference module {m}')
if len(meta.get('safety_contract',{}).get('rules',[]))<4:errors.append('interaction safety contract incomplete')
if len(meta.get('learning_routes',[]))<3:errors.append('learning routes incomplete')
# HTML ids and refs
class P(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id'in a:self.ids.append(a['id'])
        if tag in ('script','img','link','a'):
            k={'script':'src','img':'src','link':'href','a':'href'}[tag]
            if a.get(k):self.refs.append(a[k])
for html in root.glob('*.html'):
    p=P();p.feed(html.read_text(encoding='utf-8'))
    dup=sorted({x for x in p.ids if p.ids.count(x)>1})
    if dup:errors.append(f'{html.name} duplicate ids: {dup}')
    for ref in p.refs:
        if ref.startswith(('http:','https:','mailto:','#','javascript:')):continue
        clean=ref.split('?')[0].split('#')[0]
        if clean and not (html.parent/clean).exists():errors.append(f'{html.name} missing local ref {clean}')
app=(root/'app.html').read_text(encoding='utf-8'); js=(root/'assets/js/clinical-reference.js').read_text(encoding='utf-8'); ai=(root/'assets/js/ai-study.js').read_text(encoding='utf-8')
sidebar=app.split('</aside>',1)[0]
if 'Clinical Reference' in sidebar:errors.append('Clinical Reference must not be a separate Sidebar item')
for marker in ['clinicalWorkspace','clinicalTabs','clinicalSearch','clinicalSpecialty','clinicalList','clinicalDetail','aria-label="Clinical Reference workspace"']:
    if marker not in app:errors.append(f'app.html missing Phase 4 marker {marker}')
for marker in ['reference_module','data-open-dictionary-term','ai.html?term=','speechSynthesis','pulse_pressure','safety_contract','learning_routes','data-calculator']:
    if marker not in js:errors.append(f'clinical-reference.js missing runtime marker {marker}')
if "get('term')" not in ai or 'URLSearchParams(location.search)' not in ai:errors.append('AI Study does not accept Clinical Reference term handoff')
# clean-runtime audit
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['app.html','assets/css/app.css','assets/css/clinical-reference.css','assets/js/dictionary.js','assets/js/clinical-reference.js'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-shell','v20-dictionary','v20-clinical']:
    if banned in joined:errors.append(f'legacy runtime reference: {banned}')
# service worker
sw=(root/'sw.js').read_text(encoding='utf-8')
offline_coverage=sw
if (root/'data/offline-packs.json').is_file(): offline_coverage += '\n'+(root/'data/offline-packs.json').read_text(encoding='utf-8')
for path in ['./assets/css/clinical-reference.css','./assets/js/clinical-reference.js','./data/clinical-calculators.json','./data/clinical-reference.json','./data/index.json']:
    if path not in offline_coverage:errors.append(f'offline coverage missing {path}')
for x in re.findall(r"'\./([^']+)'",sw):
    if x and not (root/x).exists():errors.append(f'service worker references missing file {x}')
# workflow
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase4.py' not in wf:errors.append('workflow does not run Phase 4 verifier')
if yaml:
    try:
        y=yaml.safe_load(wf)
        if not isinstance(y,dict) or 'jobs' not in y:errors.append('workflow YAML missing jobs')
    except Exception as e:errors.append(f'workflow YAML invalid: {e}')
else:notes.append('PyYAML unavailable; YAML parse skipped')
# JS syntax
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax skipped')
# calculator runtime smoke using the same formulas (no DOM dependency)
try:
    probe="""
const fs=require('fs');const d=JSON.parse(fs.readFileSync('data/clinical-calculators.json','utf8'));
if(d.calculators.length!==7)throw Error('count');
const f={c_to_f:v=>v.celsius*9/5+32,f_to_c:v=>(v.fahrenheit-32)*5/9,ml_to_l:v=>v.ml/1000,l_to_ml:v=>v.liters*1000,mg_to_g:v=>v.mg/1000,pulse_pressure:v=>v.systolic-v.diastolic,map:v=>(v.systolic+2*v.diastolic)/3};
if(f.c_to_f({celsius:0})!==32)throw Error('c_to_f');if(Math.abs(f.f_to_c({fahrenheit:32}))>1e-9)throw Error('f_to_c');if(f.ml_to_l({ml:1000})!==1)throw Error('ml');if(f.l_to_ml({liters:1.5})!==1500)throw Error('l');if(f.mg_to_g({mg:1000})!==1)throw Error('mg');if(f.pulse_pressure({systolic:120,diastolic:80})!==40)throw Error('pp');if(Math.abs(f.map({systolic:120,diastolic:80})-93.3333333333)>.001)throw Error('map');console.log('calculator formulas ok');
"""
    r=subprocess.run(['node','-e',probe],cwd=root,capture_output=True,text=True)
    if r.returncode:errors.append(f'calculator runtime smoke failed: {r.stderr.strip()}')
    else:notes.append(r.stdout.strip())
except FileNotFoundError:notes.append('node unavailable; calculator smoke skipped')
if errors:
    print('PHASE 4 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 4 VERIFY PASS')
print('conditions:',counts['conditions'],'procedures:',counts['procedures'],'drugs:',counts['drugs'],'calculators:',len(calcs))
for n in notes:print('NOTE:',n)
