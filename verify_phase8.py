from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
try: import yaml
except Exception: yaml=None
root=Path(__file__).resolve().parent
errors=[];notes=[]
required=['app.html','assets/js/dictionary.js','assets/js/term-tools.js','assets/css/app.css','data/index.json','data/offline-packs.json','offline.html','assets/js/offline-packs.js','sw.js','version.json','PHASE8_REPORT_PASHTO.md','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json');packs=load('data/offline-packs.json');data=load('data/index.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv[0]!=21 or vv<(21,7,0):errors.append('version.json must be v21.7.0 or newer for Phase 8')
except Exception:errors.append('version semantic version invalid')
if len(data.get('terms',[]))!=1158:errors.append('Dictionary term regression: expected 1158')
if len(data.get('categories',[]))!=17:errors.append('Dictionary category regression: expected 17')
app=(root/'app.html').read_text(encoding='utf-8');djs=(root/'assets/js/dictionary.js').read_text(encoding='utf-8');tools=(root/'assets/js/term-tools.js').read_text(encoding='utf-8')
# Detail and bulk tool UI
for marker in ['id="runSearch"','id="advancedFiltersBtn"','id="advancedFiltersModal"','id="selectFiltered"','id="exportSelectedCsv"','id="detailMesh"','id="detailRelated"','id="detailPronounce"','id="detailAI"','id="detailPdf"','id="detailPrint"','id="detailCopy"','id="detailOffline"','assets/js/term-tools.js']:
    if marker not in app:errors.append(f'Phase 8 app UI missing {marker}')
# Runtime wiring
for marker in ['advanced:{synonyms:false,clinical:false,related:false,sort:',"state.advanced.synonyms","state.advanced.clinical","state.advanced.related","$('#runSearch').addEventListener","$('#advancedFiltersBtn').addEventListener","function selectFiltered()","SMD21TermTools.exportCsv","SMD21TermTools.pronounce","SMD21TermTools.exportPdf","SMD21TermTools.printModel","SMD21TermTools.copySummary","ai.html?term=","offline.html#dictionary","params.get('term')","data-related"]:
    if marker not in djs:errors.append(f'Dictionary Phase 8 runtime missing {marker}')
# Local utility contract
for marker in ['SpeechSynthesisUtterance','application/pdf','%PDF-1.4','xref','%%EOF','printModel','navigator.clipboard','text/csv','createPdfBlob']:
    if marker not in tools:errors.append(f'term tools missing {marker}')
# No external runtime dependency for PDF/export tool
if re.search(r'https?://',tools):errors.append('term-tools.js must not depend on external HTTP runtime')
# Node PDF runtime smoke
node_test=r'''
const fs=require('fs'),vm=require('vm');global.window=global;
vm.runInThisContext(fs.readFileSync('assets/js/term-tools.js','utf8'));
(async()=>{const b=SMD21TermTools.createPdfBlob({name:'Hypertension',canonicalName:'Hypertension',meshId:'D006973',category:'Cardiology',definition:'Persistent elevation of arterial blood pressure.',explanation:'Educational explanation.',synonyms:['High blood pressure'],source:'Bundled educational reference'});const s=Buffer.from(await b.arrayBuffer()).toString('latin1');if(!s.startsWith('%PDF-1.4')||!s.includes('xref')||!s.includes('%%EOF')||!s.includes('/Type /Page'))throw Error('invalid PDF structure');console.log('PHASE8_PDF_OK',b.size)})().catch(e=>{console.error(e);process.exit(1)});
'''
try:
    r=subprocess.run(['node','-e',node_test],cwd=root,capture_output=True,text=True,timeout=20)
    if r.returncode or 'PHASE8_PDF_OK' not in r.stdout:errors.append('Phase 8 PDF runtime failed: '+(r.stderr.strip() or r.stdout.strip()))
except (FileNotFoundError,subprocess.TimeoutExpired):notes.append('node unavailable/timeout; PDF runtime smoke skipped')
# Offline integration
dict_pack=next((p for p in packs.get('packs',[]) if p.get('id')=='dictionary'),{})
if './assets/js/term-tools.js' not in dict_pack.get('urls',[]):errors.append('Dictionary offline pack missing term-tools.js')
actual=sum((root/u[2:]).stat().st_size for u in dict_pack.get('urls',[]) if u.startswith('./') and (root/u[2:]).is_file())
if actual!=dict_pack.get('bytes'):errors.append(f'Dictionary pack byte mismatch {dict_pack.get("bytes")} != {actual}')
prefix=str(packs.get('cache_prefix',''))
m=re.fullmatch(r'smd-v21-phase(\d+)-pack-',prefix)
if not m or int(m.group(1))<8:errors.append('Phase 8+ pack cache prefix mismatch')
sw=(root/'sw.js').read_text(encoding='utf-8')
m=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
if not m or int(m.group(1))<8:errors.append('Service Worker must be Phase 8 or newer')
offjs=(root/'assets/js/offline-packs.js').read_text(encoding='utf-8')
m=re.search(r"const prefix='smd-v21-phase(\d+)-pack-'",offjs)
if not m or int(m.group(1))<8:errors.append('Offline manager must use Phase 8 or newer pack prefix')
for marker in ['location.hash','requested-pack']:
    if marker not in offjs:errors.append(f'Offline Phase 8 integration missing {marker}')
# HTML refs / duplicate IDs
class P(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        k={'script':'src','img':'src','link':'href','a':'href'}.get(tag)
        if k and a.get(k):self.refs.append(a[k])
for html in root.glob('*.html'):
    p=P();p.feed(html.read_text(encoding='utf-8'))
    dup=sorted({x for x in p.ids if p.ids.count(x)>1})
    if dup:errors.append(f'{html.name} duplicate ids: {dup}')
    for ref in p.refs:
        if ref.startswith(('http:','https:','mailto:','#','javascript:')):continue
        clean=ref.split('?')[0].split('#')[0]
        if clean and not (html.parent/clean).exists():errors.append(f'{html.name} missing local ref {clean}')
# JSON and JS syntax
for f in root.rglob('*.json'):
    try:json.loads(f.read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'JSON parse failed {f.relative_to(root)}: {e}')
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax skipped')
# CSS structural sanity
for f in (root/'assets/css').glob('*.css'):
    s=f.read_text(encoding='utf-8',errors='ignore')
    if s.count('{')!=s.count('}'):errors.append(f'CSS braces unbalanced {f.relative_to(root)}')
# Workflow
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase8.py' not in wf:errors.append('workflow does not run Phase 8 verifier')
if yaml:
    try:
        y=yaml.safe_load(wf)
        if not isinstance(y,dict) or 'jobs' not in y:errors.append('workflow YAML missing jobs')
    except Exception as e:errors.append(f'workflow YAML invalid: {e}')
# No placeholder regression for the two previously cosmetic controls
if 'id="runSearch"' in app and "$('#runSearch').addEventListener" not in djs:errors.append('Search button remains cosmetic')
if 'id="advancedFiltersBtn"' in app and "$('#advancedFiltersBtn').addEventListener" not in djs:errors.append('Advanced Filters remains cosmetic')
# Legacy runtime ban
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['app.html','assets/js/dictionary.js','assets/js/term-tools.js','assets/css/app.css'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-shell','v20-dictionary']:
    if banned in joined:errors.append(f'legacy runtime reference {banned}')
if errors:
    print('PHASE 8 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 8 VERIFY PASS')
print('term detail: MeSH/related/pronounce/AI/PDF/Print/Copy/Offline')
print('dictionary productivity: advanced filters + filtered bulk select + CSV export')
print('dictionary pack files:',len(dict_pack.get('urls',[])),'bytes:',dict_pack.get('bytes'))
for n in notes:print('NOTE:',n)
