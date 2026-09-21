from pathlib import Path
from html.parser import HTMLParser
import json, re, subprocess, sys, tempfile
try:
    import yaml
except Exception:
    yaml=None

root=Path(__file__).resolve().parent
errors=[]; notes=[]
required=[
 'ai.html','assets/css/ai-study.css','assets/js/study-engine.js','assets/js/ai-study.js','data/ai-config.json',
 'verify_phase1.py','verify_phase2.py','verify_phase3.py','index.html','app.html','anatomy.html','privacy.html','terms.html',
 'manifest.webmanifest','sw.js','version.json','.github/workflows/deploy-pages.yml'
]
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')

def j(path):
    try:return json.loads((root/path).read_text(encoding='utf-8'))
    except Exception as e: errors.append(f'{path} invalid JSON: {e}');return {}
idx=j('data/index.json'); cfg=j('data/ai-config.json'); ver=j('version.json'); manifest=j('manifest.webmanifest')

try:
    parts=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.')[:3])
    if parts < (21,2,0) or parts[0] != 21: errors.append('version.json must be v21.2.0 or newer for Phase 3 regression')
except Exception: errors.append('version.json semantic version invalid')
if len(idx.get('terms',[]))!=1158: errors.append(f'expected 1158 dictionary terms, got {len(idx.get("terms",[]))}')
if cfg.get('zeroCostMode') is not True: errors.append('zeroCostMode must be true')
if cfg.get('allowPaidFallback') is not False: errors.append('allowPaidFallback must be false')
cloud=cfg.get('cloud',{})
if cloud.get('enabled') is not False: errors.append('optional cloud AI must be disabled by default')
if str(cloud.get('endpoint','')).strip(): errors.append('optional cloud endpoint must be blank by default')
features=set(cfg.get('localStudyEngine',{}).get('features',[]))
for x in ['explain','compare','quiz','flashcards','summary']:
    if x not in features: errors.append(f'local study feature missing from config: {x}')
if manifest.get('display')!='standalone': errors.append('manifest display must remain standalone')

class P(HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]; self.ids=[]; self.controls=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag in ('script','img','link','a'):
            k={'script':'src','img':'src','link':'href','a':'href'}[tag]
            if a.get(k):self.refs.append(a[k])
        if tag in ('input','select','textarea','button'):self.controls.append((tag,a))
for html in root.glob('*.html'):
    text=html.read_text(encoding='utf-8');p=P();p.feed(text)
    dup=sorted({x for x in p.ids if p.ids.count(x)>1})
    if dup:errors.append(f'{html.name} duplicate ids: {dup}')
    for ref in p.refs:
        if ref.startswith(('http:','https:','mailto:','#','javascript:')):continue
        clean=ref.split('?')[0].split('#')[0]
        if not clean:continue
        path=(html.parent/clean).resolve()
        try:path.relative_to(root.resolve())
        except Exception:continue
        if not path.exists():errors.append(f'{html.name} missing local ref {clean}')

ai=(root/'ai.html').read_text(encoding='utf-8')
js=(root/'assets/js/ai-study.js').read_text(encoding='utf-8')
engine=(root/'assets/js/study-engine.js').read_text(encoding='utf-8')
for marker in ['newChat','chatList','messages','promptInput','sendBtn','termSearch','providerMode','renameModal','deleteModal','data-study-action="explain"','data-study-action="compare"','data-study-action="quiz"','data-study-action="flashcards"','data-study-action="summary"']:
    if marker not in ai: errors.append(f'ai.html missing feature marker: {marker}')
for marker in ['smd21_ai_chats_','data-rename-chat','data-delete-chat','runCloud','contextIds','Local Study Engine','toggleContext']:
    if marker not in js: errors.append(f'ai-study.js missing runtime marker: {marker}')
for marker in ['function create(','safetyRx','kind:\'compare\'','kind:\'quiz\'','kind:\'flashcards\'','kind:\'summary\'','kind:\'explain\'']:
    if marker not in engine: errors.append(f'study-engine.js missing engine marker: {marker}')
for page in ['app.html','anatomy.html','ai.html']:
    txt=(root/page).read_text(encoding='utf-8')
    if 'href="ai.html"' not in txt: errors.append(f'{page} shared shell missing AI Study navigation')
    if txt.count('id="mobileMenu"')!=1: errors.append(f'{page} must have exactly one mobile Menu button')

# accessibility baseline for AI controls
for marker in ['aria-label="AI Study workspace"','aria-label="Saved study chats"','aria-label="Study message"','aria-label="Send message"','aria-label="Search terms to add to study context"','aria-label="AI provider mode"']:
    if marker not in ai: errors.append(f'AI accessibility marker missing: {marker}')

# CSS local URL reference audit
for css in (root/'assets/css').glob('*.css'):
    text=css.read_text(encoding='utf-8',errors='ignore')
    for raw in re.findall(r'url\(["\']?([^"\')]+)',text):
        if raw.startswith(('data:','http:','https:','#')):continue
        if not (css.parent/raw).resolve().exists():errors.append(f'{css.relative_to(root)} missing url() ref {raw}')

# active runtime should not reintroduce legacy v16-v20 presentation layers
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['app.html','anatomy.html','ai.html','assets/css/app.css','assets/css/anatomy.css','assets/css/ai-study.css','assets/js/ai-study.js','assets/js/study-engine.js'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-shell','v20-dictionary','v20-ai']:
    if banned in joined:errors.append(f'legacy runtime reference: {banned}')

# service worker offline coverage
sw=(root/'sw.js').read_text(encoding='utf-8')
offline_coverage=sw
if (root/'data/offline-packs.json').is_file(): offline_coverage += '\n'+(root/'data/offline-packs.json').read_text(encoding='utf-8')
for x in ['./ai.html','./assets/css/ai-study.css','./assets/js/study-engine.js','./assets/js/ai-study.js','./data/ai-config.json','./data/index.json']:
    if x not in offline_coverage:errors.append(f'offline coverage missing {x}')
# Every explicit local path in the Service Worker core must exist.
for x in re.findall(r"'\./([^']+)'", sw):
    if x and not (root/x).exists(): errors.append(f'service worker references missing local file: {x}')

# workflow parse + verifier hook
wf=root/'.github/workflows/deploy-pages.yml'
if 'python verify_phase3.py' not in wf.read_text(encoding='utf-8'):errors.append('GitHub workflow does not run Phase 3 verifier')
if yaml:
    try:
        y=yaml.safe_load(wf.read_text(encoding='utf-8'))
        if not isinstance(y,dict) or 'jobs' not in y:errors.append('workflow YAML missing jobs')
    except Exception as e:errors.append(f'workflow YAML invalid: {e}')
else:notes.append('PyYAML unavailable; workflow parse skipped')

# JS syntax
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax subprocess checks skipped')

# local Study Engine runtime smoke under Node (no DOM/browser required)
try:
    probe="""
const fs=require('fs');global.window=global;
eval(fs.readFileSync('assets/js/study-engine.js','utf8'));
const data=JSON.parse(fs.readFileSync('data/index.json','utf8'));
const e=SMD21StudyEngine.create(data.terms);
const h=e.search('Hypertension',3); if(!h.length||h[0].term!=='Hypertension') throw Error('search failed');
const id=h[0].id;
for(const a of ['explain','quiz','flashcards','summary']){const r=e.run({action:a,prompt:'Hypertension',contextIds:[id],lang:'en'});if(r.kind!==a)throw Error(a+' failed: '+r.kind)}
const d=e.search('Diabetes Mellitus',1)[0]; const c=e.run({action:'compare',prompt:'compare',contextIds:[id,d.id],lang:'en'});if(c.kind!=='compare'||c.termIds.length!==2)throw Error('compare failed');
const natural=e.run({action:'auto',prompt:'Compare Hypertension and Diabetes Mellitus',contextIds:[],lang:'en'});if(natural.kind!=='compare'||e.byId.get(natural.termIds[0]).term!=='Hypertension'||e.byId.get(natural.termIds[1]).term!=='Diabetes Mellitus')throw Error('natural compare term resolution failed');
const safe=e.run({action:'auto',prompt:'what dose should I take?',contextIds:[id],lang:'en'});if(safe.kind!=='notice')throw Error('safety boundary failed');
console.log('study-engine runtime ok');
"""
    r=subprocess.run(['node','-e',probe],cwd=root,capture_output=True,text=True)
    if r.returncode:errors.append(f'Local Study Engine runtime smoke failed: {r.stderr.strip()}')
    else:notes.append(r.stdout.strip())
except FileNotFoundError:notes.append('node unavailable; Study Engine runtime smoke skipped')

if errors:
    print('PHASE 3 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 3 VERIFY PASS')
print('terms:',len(idx.get('terms',[])),'features:',', '.join(sorted(features)))
for n in notes:print('NOTE:',n)
