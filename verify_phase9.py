from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
try: import yaml
except Exception: yaml=None
root=Path(__file__).resolve().parent
errors=[];notes=[]
MODES={
 'skeleton':('bones',206),'muscles':('muscles',50),'joints':('joints',24),'ligaments':('ligaments',29),
 'organs':('organs',15),'nerves':('nerves',24),'vessels':('vessels',25),'teeth':('teeth',32),'eye':('eye',14),'sinuses':('sinuses',8)
}
required=['anatomy.html','assets/css/anatomy.css','assets/js/anatomy.js','data/anatomy/catalog.json','data/offline-packs.json','sw.js','version.json','PHASE9_REPORT_PASHTO.md','.github/workflows/deploy-pages.yml','tools/generate_anatomy_systems.py']
required += [f'assets/models/{m}-model.json' for m in MODES]
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json');cat=load('data/anatomy/catalog.json');packs=load('data/offline-packs.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv[0]!=21 or vv<(21,8,0):errors.append('version.json must be v21.8.0 or newer for Phase 9')
except Exception:errors.append('version semantic version invalid')
if cat.get('schema')!='smd-anatomy-catalog-v2':errors.append('Phase 9 anatomy catalog schema must be v2')
if 'diagnostic' not in str(cat.get('disclaimer','')).lower():errors.append('anatomy disclaimer must explicitly reject diagnostic use')
# Catalog/model coherence
for mode,(key,expected) in MODES.items():
    rows=cat.get(key,[]); model=load(f'assets/models/{mode}-model.json'); objs=model.get('objects',[])
    if len(rows)!=expected:errors.append(f'{mode} catalog expected {expected}, got {len(rows)}')
    if mode not in ('skeleton','muscles') and cat.get(f'{mode}_count')!=expected:errors.append(f'{mode}_count mismatch')
    if model.get('schema')!='smd3d-polyline-v1':errors.append(f'{mode} model schema mismatch')
    if model.get('object_count')!=expected or len(objs)!=expected:errors.append(f'{mode} model expected {expected} objects')
    ids=[x.get('id') for x in rows]; mids=[x.get('id') for x in objs]
    if len(set(ids))!=len(ids):errors.append(f'{mode} catalog IDs not unique')
    if set(ids)!=set(mids):errors.append(f'{mode} catalog/model IDs mismatch')
    for i,x in enumerate(rows):
        for field in ['id','name','latin','location','description','region']:
            if not str(x.get(field,'')).strip():errors.append(f'{mode}[{i}] missing {field}')
    for i,o in enumerate(objs):
        pts=o.get('points')
        if not isinstance(pts,list) or len(pts)<2:errors.append(f'{mode} model object {o.get("id",i)} invalid points');continue
        for p in pts:
            if not isinstance(p,list) or len(p)!=3 or not all(isinstance(v,(int,float)) for v in p):errors.append(f'{mode} {o.get("id",i)} malformed 3D point');break
        if not isinstance(o.get('width'),(int,float)) or o.get('width',0)<=0:errors.append(f'{mode} {o.get("id",i)} invalid width')
expanded=set(cat.get('expanded_systems',[]))
for label in ['Joints','Ligaments','Organs','Nerves','Vessels','Teeth','Eye','Sinuses']:
    if label not in expanded:errors.append(f'expanded_systems missing {label}')
# User-facing UI/runtime markers
html=(root/'anatomy.html').read_text(encoding='utf-8'); js=(root/'assets/js/anatomy.js').read_text(encoding='utf-8'); css=(root/'assets/css/anatomy.css').read_text(encoding='utf-8')
for mode in MODES:
    if f'data-enter-mode="{mode}"' not in html:errors.append(f'chooser missing {mode}')
    if f'data-mode="{mode}"' not in html:errors.append(f'viewer system switch missing {mode}')
    if f"{mode}: {{" not in js:errors.append(f'MODE_META missing {mode}')
for marker in ['system-switch','English + Latin','Pronounce','isolateToggle','labelsToggle','Skeleton base','Search anatomy']:
    if marker not in html:errors.append(f'anatomy UI missing {marker}')
for marker in ['const MODE_META','function entriesForMode','function objectColors','function labelCandidates','function drawSkeletonBase','speechSynthesis','hitTest(',"params.get('mode')"]:
    if marker not in js:errors.append(f'anatomy runtime missing {marker}')
if 'Prepared for later layers' in html:errors.append('Phase 9 UI still presents expanded systems as future placeholders')
if 'systems-expanded' not in css or 'system-switch' not in css:errors.append('Phase 9 responsive system chooser/switch CSS missing')
# Anatomy offline pack
an=next((x for x in packs.get('packs',[]) if x.get('id')=='anatomy'),{})
expected_urls=['./anatomy.html','./assets/css/anatomy.css','./assets/js/anatomy.js','./data/anatomy/catalog.json']+[f'./assets/models/{m}-model.json' for m in MODES]
for u in expected_urls:
    if u not in an.get('urls',[]):errors.append(f'anatomy offline pack missing {u}')
for u in an.get('urls',[]):
    if u.startswith('./') and not (root/u[2:]).is_file():errors.append(f'anatomy offline pack points to missing {u}')
actual=sum((root/u[2:]).stat().st_size for u in an.get('urls',[]) if u.startswith('./') and (root/u[2:]).is_file())
if actual!=an.get('bytes'):errors.append(f'anatomy pack byte mismatch {an.get("bytes")} != {actual}')
sw=(root/'sw.js').read_text(encoding='utf-8')
m=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
if not m or int(m.group(1))<9:errors.append('Service Worker must be Phase 9 or newer')
else:
    expected_prefix=f"smd-v21-phase{m.group(1)}-pack-"
    if packs.get('cache_prefix')!=expected_prefix:errors.append('Phase 9+ pack cache prefix mismatch')
off=(root/'assets/js/offline-packs.js').read_text(encoding='utf-8')
if m and f"const prefix='smd-v21-phase{m.group(1)}-pack-'" not in off:errors.append('Offline manager prefix does not match active Phase 9+ Service Worker')
# HTML refs/IDs
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
# JSON/JS/CSS/Python structural QA
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
try:
    for f in [root/'tools/generate_anatomy_systems.py',root/'verify_phase9.py']:
        r=subprocess.run([sys.executable,'-m','py_compile',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'Python compile failed {f.relative_to(root)}: {r.stderr.strip()}')
except Exception as e:notes.append(f'python compile skipped: {e}')
# Workflow
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase9.py' not in wf:errors.append('workflow does not run Phase 9 verifier')
if yaml:
    try:
        y=yaml.safe_load(wf)
        if not isinstance(y,dict) or 'jobs' not in y:errors.append('workflow YAML missing jobs')
    except Exception as e:errors.append(f'workflow YAML invalid: {e}')
# No active legacy runtime layering
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['anatomy.html','assets/js/anatomy.js','assets/css/anatomy.css'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-anatomy']:
    if banned in joined:errors.append(f'legacy anatomy runtime reference {banned}')
if errors:
    print('PHASE 9 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 9 VERIFY PASS')
print('systems:',', '.join(f'{m}={n}' for m,(_,n) in MODES.items()))
print('anatomy pack files:',len(an.get('urls',[])),'bytes:',an.get('bytes'))
for n in notes:print('NOTE:',n)
