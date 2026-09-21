from pathlib import Path
from html.parser import HTMLParser
import json, re, subprocess, sys
try:
    import yaml
except Exception:
    yaml=None

root=Path(__file__).resolve().parent
errors=[]; notes=[]
required=[
    'anatomy.html','assets/css/anatomy.css','assets/js/anatomy.js','data/anatomy/catalog.json',
    'assets/models/skeleton-model.json','assets/models/muscles-model.json','verify_phase1.py','verify_phase2.py',
    'index.html','app.html','privacy.html','terms.html','manifest.webmanifest','sw.js','version.json',
    '.github/workflows/deploy-pages.yml'
]
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')

def read_json(path):
    try: return json.loads((root/path).read_text(encoding='utf-8'))
    except Exception as e: errors.append(f'{path} invalid JSON: {e}'); return {}

manifest=read_json('manifest.webmanifest')
version=read_json('version.json')
catalog=read_json('data/anatomy/catalog.json')
skel=read_json('assets/models/skeleton-model.json')
musc=read_json('assets/models/muscles-model.json')


try:
    parts=tuple(int(x) for x in str(version.get('version','0.0.0')).split('.')[:3])
    if parts < (21,1,0) or parts[0] != 21: errors.append('version.json must be v21.1.0 or newer for Phase 2 regression')
except Exception: errors.append('version.json semantic version invalid')
if manifest.get('display')!='standalone': errors.append('PWA manifest display should be standalone')

bones=catalog.get('bones',[]); muscles=catalog.get('muscles',[])
if catalog.get('bone_count')!=206 or len(bones)!=206: errors.append(f'expected exactly 206 bones, got catalog count={catalog.get("bone_count")} list={len(bones)}')
if len({x.get('id') for x in bones})!=206: errors.append('bone IDs are not unique')
if len(muscles)<40: errors.append(f'expected at least 40 major selectable muscles, got {len(muscles)}')
if len({x.get('id') for x in muscles})!=len(muscles): errors.append('muscle IDs are not unique')
for kind,rows in [('bone',bones),('muscle',muscles)]:
    for i,x in enumerate(rows):
        for key in ['id','name','latin','location','description']:
            if not str(x.get(key,'')).strip(): errors.append(f'{kind}[{i}] missing {key}')

sobjs=skel.get('objects',[]); mobjs=musc.get('objects',[])
if skel.get('schema')!='smd3d-polyline-v1': errors.append('skeleton model schema mismatch')
if musc.get('schema')!='smd3d-polyline-v1': errors.append('muscle model schema mismatch')
if skel.get('object_count')!=206 or len(sobjs)!=206: errors.append('skeleton model must have exactly 206 objects')
if musc.get('object_count')!=len(muscles) or len(mobjs)!=len(muscles): errors.append('muscle model/catalog count mismatch')
if {x.get('id') for x in bones}!={x.get('id') for x in sobjs}: errors.append('bone catalog IDs do not exactly match skeleton model IDs')
if {x.get('id') for x in muscles}!={x.get('id') for x in mobjs}: errors.append('muscle catalog IDs do not exactly match muscle model IDs')
for model_name,objs in [('skeleton',sobjs),('muscles',mobjs)]:
    for i,o in enumerate(objs):
        pts=o.get('points')
        if not isinstance(pts,list) or len(pts)<2: errors.append(f'{model_name} object {o.get("id",i)} has invalid points'); continue
        for p in pts:
            if not isinstance(p,list) or len(p)!=3 or not all(isinstance(v,(int,float)) for v in p):
                errors.append(f'{model_name} object {o.get("id",i)} has malformed 3D point'); break
        if not isinstance(o.get('width'),(int,float)) or o.get('width',0)<=0: errors.append(f'{model_name} object {o.get("id",i)} width invalid')

future=set(catalog.get('future_layers',[]))
for layer in ['Joints','Ligaments','Nerves','Vessels','Organs','Teeth','Eye / Sinuses']:
    if layer not in future: errors.append(f'future layer foundation missing: {layer}')

class P(HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]; self.ids=[]; self.buttons=[]; self.controls=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag in ('script','img','link','a'):
            k={'script':'src','img':'src','link':'href','a':'href'}[tag]
            if a.get(k): self.refs.append(a[k])
        if tag in ('input','select','canvas'):
            self.controls.append((tag,a))
        if tag=='button': self.buttons.append(a)

for html in root.glob('*.html'):
    text=html.read_text(encoding='utf-8')
    p=P(); p.feed(text)
    dups=sorted({x for x in p.ids if p.ids.count(x)>1})
    if dups: errors.append(f'{html.name} duplicate ids: {dups}')
    for ref in p.refs:
        if ref.startswith(('http:','https:','mailto:','#','javascript:')): continue
        clean=ref.split('?')[0].split('#')[0]
        if not clean: continue
        path=(html.parent/clean).resolve()
        try: path.relative_to(root.resolve())
        except Exception: continue
        if not path.exists(): errors.append(f'{html.name} missing local ref {clean}')

# CSS url() local reference audit
for css in (root/'assets/css').glob('*.css'):
    text=css.read_text(encoding='utf-8',errors='ignore')
    for raw in re.findall(r'url\(["\']?([^"\')]+)',text):
        if raw.startswith(('data:','http:','https:','#')): continue
        path=(css.parent/raw).resolve()
        if not path.exists(): errors.append(f'{css.relative_to(root)} missing url() ref {raw}')

anatomy_html=(root/'anatomy.html').read_text(encoding='utf-8')
anatomy_js=(root/'assets/js/anatomy.js').read_text(encoding='utf-8')
app_html=(root/'app.html').read_text(encoding='utf-8')
for required_text in ['Skeleton','Muscles','Male','Female','rotateLeft','panLeft','zoomIn','resetView','isolateToggle','labelsToggle','pronounceBtn','layerSelect']:
    if required_text not in anatomy_html: errors.append(f'anatomy.html missing UI feature marker: {required_text}')
if 'Back to Anatomy &amp; Muscles' not in anatomy_html and 'Back to Anatomy Systems' not in anatomy_html: errors.append('anatomy.html missing back-to-anatomy control')
for marker in ['hitTest(','speechSynthesis','setMode(','state.zoom','state.panX','state.yaw','206']:
    if marker not in anatomy_js: errors.append(f'anatomy.js missing runtime feature marker: {marker}')
if 'anatomy.html' not in app_html: errors.append('Dictionary shared shell has no 3D Anatomy navigation')
if anatomy_html.count('id="mobileMenu"')!=1: errors.append('Anatomy mobile shell must have exactly one Menu button')
# Ensure Clinical Reference is not a sidebar destination on Anatomy page
sidebar_chunk=anatomy_html.split('</aside>',1)[0]
if 'Clinical Reference' in sidebar_chunk: errors.append('Clinical Reference must not be a separate Anatomy sidebar item')

# accessibility baseline: key interactive canvas and search must be labelled
for marker in ['aria-label="Interactive 3D anatomy model"','aria-label="Search anatomy"','aria-label="Viewer controls"','role="listbox"']:
    if marker not in anatomy_html: errors.append(f'basic accessibility marker missing: {marker}')
if 'aria-label="Anatomy mode"' not in anatomy_html and 'aria-label="Anatomy system"' not in anatomy_html: errors.append('basic accessibility marker missing: anatomy mode/system group label')

# legacy layering audit
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['app.html','anatomy.html','assets/css/app.css','assets/css/anatomy.css','assets/js/anatomy.js'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-shell','v20-dictionary','v20-anatomy']:
    if banned in joined: errors.append(f'legacy runtime reference: {banned}')

# Service worker offline core
sw=(root/'sw.js').read_text(encoding='utf-8')
offline_coverage=sw
if (root/'data/offline-packs.json').is_file(): offline_coverage += '\n'+(root/'data/offline-packs.json').read_text(encoding='utf-8')
for f in ['./anatomy.html','./assets/css/anatomy.css','./assets/js/anatomy.js','./data/anatomy/catalog.json','./assets/models/skeleton-model.json','./assets/models/muscles-model.json']:
    if f not in offline_coverage: errors.append(f'offline coverage missing {f}')

# Workflow YAML parse/check
workflow=root/'.github/workflows/deploy-pages.yml'
if yaml:
    try:
        y=yaml.safe_load(workflow.read_text(encoding='utf-8'))
        if not isinstance(y,dict) or 'jobs' not in y: errors.append('GitHub workflow YAML missing jobs')
    except Exception as e: errors.append(f'GitHub workflow YAML invalid: {e}')
else: notes.append('PyYAML unavailable; YAML parse skipped')

# JS syntax checks
js_files=list((root/'assets/js').glob('*.js'))+[root/'sw.js']
try:
    for js in js_files:
        r=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
        if r.returncode: errors.append(f'JS syntax failed {js.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:
    notes.append('node unavailable; JS syntax subprocess checks skipped')

if errors:
    print('PHASE 2 VERIFY FAIL')
    for e in errors: print('-',e)
    for n in notes: print('NOTE:',n)
    sys.exit(1)
print('PHASE 2 VERIFY PASS')
print('bones:',len(bones),'muscles:',len(muscles),'skeleton objects:',len(sobjs),'muscle objects:',len(mobjs))
for n in notes: print('NOTE:',n)
