from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,subprocess,sys
root=Path(__file__).resolve().parent
errors=[];notes=[]
required=['assets/js/unified-search.js','assets/css/unified-search.css','data/crosslinks.json','tools/generate_crosslinks.py','verify_phase12.py','PHASE12_REPORT_PASHTO.md','version.json','data/offline-packs.json','sw.js','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json');packs=load('data/offline-packs.json');idx=load('data/index.json');cat=load('data/anatomy/catalog.json');cross=load('data/crosslinks.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv<(21,11,0) or vv[0]!=21:errors.append('version.json must be v21.11.0 or newer for Phase 12')
except Exception:errors.append('version.json semantic version invalid')
# Cross-link integrity
terms={t.get('id') for t in idx.get('terms',[])}
key_for={'skeleton':'bones','muscles':'muscles','joints':'joints','ligaments':'ligaments','organs':'organs','nerves':'nerves','vessels':'vessels','teeth':'teeth','eye':'eye','sinuses':'sinuses'}
structs={(mode,s.get('id')) for mode,key in key_for.items() for s in cat.get(key,[])}
t2a=cross.get('term_to_anatomy',{});a2t=cross.get('anatomy_to_terms',{})
if cross.get('schema')!='smd21-crosslinks-v1':errors.append('crosslink schema mismatch')
if cross.get('term_count')!=len(t2a):errors.append('crosslink term_count mismatch')
if cross.get('structure_count')!=len(a2t):errors.append('crosslink structure_count mismatch')
if len(t2a)<180 or len(a2t)<240:errors.append(f'crosslink coverage unexpectedly small: {len(t2a)} terms / {len(a2t)} structures')
for tid,refs in t2a.items():
    if tid not in terms:errors.append(f'crosslink unknown term {tid}');continue
    if not isinstance(refs,list) or not refs:errors.append(f'crosslink term has no refs {tid}');continue
    for r in refs:
        mode,sid=r.get('system'),r.get('structure_id')
        if (mode,sid) not in structs:errors.append(f'crosslink unknown structure {mode}:{sid}')
        rev=a2t.get(f'{mode}:{sid}',[])
        if tid not in rev:errors.append(f'crosslink reverse mapping missing {tid} -> {mode}:{sid}')
for key,tids in a2t.items():
    if ':' not in key:errors.append(f'invalid reverse key {key}');continue
    mode,sid=key.split(':',1)
    if (mode,sid) not in structs:errors.append(f'reverse map unknown structure {key}')
    for tid in tids:
        if tid not in terms:errors.append(f'reverse map unknown term {tid}')
# Generator reproducibility
try:
    before=hashlib.sha256((root/'data/crosslinks.json').read_bytes()).hexdigest()
    r=subprocess.run([sys.executable,str(root/'tools/generate_crosslinks.py')],cwd=root,capture_output=True,text=True)
    if r.returncode:errors.append('crosslink generator failed: '+r.stderr.strip())
    after=hashlib.sha256((root/'data/crosslinks.json').read_bytes()).hexdigest()
    if before!=after:errors.append('crosslink generator is not deterministic')
except Exception as e:notes.append(f'generator reproducibility skipped: {e}')
# Runtime contracts
us=(root/'assets/js/unified-search.js').read_text(encoding='utf-8')
for marker in ["fetch('data/index.json'","fetch('data/anatomy/catalog.json'","fetch('data/crosslinks.json'","setAttribute('role','combobox')","ArrowDown","ArrowUp","aria-activedescendant","ctrlKey","e.key==='/'","skip-link","global-search-results"]:
    if marker not in us:errors.append(f'unified search marker missing: {marker}')
dictjs=(root/'assets/js/dictionary.js').read_text(encoding='utf-8');anatjs=(root/'assets/js/anatomy.js').read_text(encoding='utf-8');clin=(root/'assets/js/clinical-reference.js').read_text(encoding='utf-8')
for marker in ["data/crosslinks.json","renderAnatomyLinks","anatomy.html?mode=","detailClinical","clinicalTerm"]:
    if marker not in dictjs:errors.append(f'dictionary cross-navigation missing {marker}')
for marker in ["data/crosslinks.json","openDictionaryBtn","params.get('structure')","selectStructure(deepStructure"]:
    if marker not in anatjs:errors.append(f'anatomy deep-link/reverse navigation missing {marker}')
for marker in ["function openTerm(id,module)","params.get('clinicalTerm')","window.SMD21Clinical={openModule,openTerm}"]:
    if marker not in clin:errors.append(f'clinical deep-link missing {marker}')
app=(root/'app.html').read_text(encoding='utf-8');anath=(root/'anatomy.html').read_text(encoding='utf-8')
for marker in ['detailAnatomySection','detailAnatomyLinks','detailClinical','role="status" aria-live="polite"','aria-label="Close term details"']:
    if marker not in app:errors.append(f'app accessibility/crosslink marker missing {marker}')
for marker in ['openDictionaryBtn','id="structureCount" role="status" aria-live="polite"']:
    if marker not in anath:errors.append(f'anatomy accessibility/crosslink marker missing {marker}')
# Shared pages load unified assets
pages=['app.html','anatomy.html','ai.html','offline.html','settings.html','about.html','privacy.html','terms.html','admin.html']
for fn in pages:
    s=(root/fn).read_text(encoding='utf-8')
    if 'assets/css/unified-search.css' not in s:errors.append(f'{fn} missing unified search CSS')
    if 'assets/js/unified-search.js' not in s:errors.append(f'{fn} missing unified search JS')
# Offline/PWA contracts
def local_path(url):
    clean=url.split('?',1)[0].split('#',1)[0]
    if clean in ('./',''):return None
    if clean.startswith('./'):clean=clean[2:]
    return root/clean
core=packs.get('core',{});plist={p.get('id'):p for p in packs.get('packs',[])}
for u in ['./assets/css/unified-search.css','./assets/js/unified-search.js']:
    if u not in core.get('urls',[]):errors.append(f'Core Offline Shell missing {u}')
for pid in ['dictionary','anatomy']:
    if './data/crosslinks.json' not in plist.get(pid,{}).get('urls',[]):errors.append(f'{pid} offline pack missing crosslinks')
for sec in [core]+list(plist.values()):
    urls=sec.get('urls',[])
    for u in urls:
        p=local_path(u)
        if p is not None and not p.exists():errors.append(f'offline URL missing local file {u}')
    actual=sum(local_path(u).stat().st_size for u in urls if local_path(u) is not None and local_path(u).is_file())
    if sec.get('bytes')!=actual:errors.append(f"offline byte total mismatch for {sec.get('id','core')}: {sec.get('bytes')} != {actual}")
if core.get('files')!=len(core.get('urls',[])):errors.append('core files count mismatch')
sw=(root/'sw.js').read_text(encoding='utf-8');off=(root/'assets/js/offline-packs.js').read_text(encoding='utf-8')
m=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw);
if not m or int(m.group(1))<12:errors.append('Service Worker cache must be Phase 12 or newer')
m=re.fullmatch(r'smd-v21-phase(\d+)-pack-',str(packs.get('cache_prefix','')));
if not m or int(m.group(1))<12:errors.append('offline pack prefix must be Phase 12 or newer')
m=re.search(r"const prefix='smd-v21-phase(\d+)-pack-'",off);
if not m or int(m.group(1))<12:errors.append('offline runtime prefix must be Phase 12 or newer')
for u in ['./assets/css/unified-search.css','./assets/js/unified-search.js']:
    if repr(u) not in sw:errors.append(f'Service Worker core missing {u}')
# HTML duplicate IDs and local refs
class P(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        k={'script':'src','img':'src','link':'href','a':'href'}.get(tag)
        if k and a.get(k):self.refs.append(a[k])
for h in root.glob('*.html'):
    p=P();p.feed(h.read_text(encoding='utf-8'))
    dup=sorted({x for x in p.ids if p.ids.count(x)>1})
    if dup:errors.append(f'{h.name} duplicate ids: {dup}')
    for ref in p.refs:
        if ref.startswith(('http:','https:','mailto:','#','javascript:')):continue
        clean=ref.split('?')[0].split('#')[0]
        if clean and not (h.parent/clean).exists():errors.append(f'{h.name} missing local ref {clean}')
# No external runtime JS/CSS dependencies on main workspace pages
for fn in pages:
    s=(root/fn).read_text(encoding='utf-8')
    if re.search(r'<script[^>]+src=["\']https?://',s,re.I):errors.append(f'{fn} has external runtime script')
    if re.search(r'<link[^>]+href=["\']https?://[^>]+rel=["\']stylesheet',s,re.I):errors.append(f'{fn} has external runtime stylesheet')
# Syntax/parse
for f in root.rglob('*.json'):
    try:json.loads(f.read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'JSON parse failed {f.relative_to(root)}: {e}')
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax skipped')
for f in (root/'assets/css').glob('*.css'):
    s=f.read_text(encoding='utf-8',errors='ignore')
    if s.count('{')!=s.count('}'):errors.append(f'CSS braces unbalanced {f.relative_to(root)}')
# Accessibility/touch markers
css=(root/'assets/css/unified-search.css').read_text(encoding='utf-8')
for marker in [':focus-visible','min-height:44px','@media (pointer:coarse)','.skip-link','.global-search-results']:
    if marker not in css:errors.append(f'accessibility CSS missing {marker}')
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase12.py' not in wf:errors.append('workflow does not run Phase 12 verifier')
if errors:
    print('PHASE 12 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 12 VERIFY PASS')
print('crosslinks:',len(t2a),'Dictionary terms /',len(a2t),'Anatomy structures')
print('Core Offline Shell:',core.get('files'),'files /',core.get('bytes'),'bytes')
for n in notes:print('NOTE:',n)
