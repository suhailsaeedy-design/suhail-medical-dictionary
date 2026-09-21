from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
root=Path(__file__).resolve().parent
errors=[]

def txt(rel):
    try:return (root/rel).read_text(encoding='utf-8')
    except Exception as e:errors.append(f'missing/read error {rel}: {e}');return ''
def jsn(rel):
    try:return json.loads(txt(rel))
    except Exception as e:errors.append(f'invalid JSON {rel}: {e}');return {}

required=['assets/css/visual-polish.css','assets/js/visual-polish.js','verify_phase16.py','PHASE16_REPORT_PASHTO.md','app.html','version.json','data/offline-packs.json','sw.js','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file():errors.append(f'missing {f}')

ver=jsn('version.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv<(21,15,0) or vv[0]!=21:errors.append('Phase 16 requires v21.15.0 or newer')
except Exception:errors.append('version semantic version invalid')
if 'Phase 16' not in str(ver.get('scope','')):errors.append('Phase 16 visual scope missing from release metadata')

app=txt('app.html')
for marker in ['assets/css/visual-polish.css','assets/js/visual-polish.js','id="visualZoomOut"','id="visualZoomIn"','id="visualAutoRotate"','id="visualReset"','class="visual-badge"']:
    if marker not in app:errors.append(f'app visual marker missing: {marker}')
if 'Interactive visual' not in app:errors.append('detail visual badge missing')

vjs=txt('assets/js/visual-polish.js')
for marker in ['pointerdown','pointermove','pointerup','setPointerCapture','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','visualZoomIn','visualZoomOut','visualAutoRotate','visualReset','prefers-reduced-motion','MutationObserver','assets/images/heart.webp']:
    if marker not in vjs:errors.append(f'visual runtime marker missing: {marker}')
# Do not misrepresent image interaction as a clinical/real 3D mesh.
for bad in ['clinical 3D mesh','real 3D image','diagnostic 3D']:
    if bad.lower() in vjs.lower() or bad.lower() in txt('assets/css/visual-polish.css').lower():errors.append(f'misleading visual claim: {bad}')

css=txt('assets/css/visual-polish.css')
for marker in ['.term-card::before','.term-card:hover','.detail-visual','touch-action:none','.visual-toolbar','@media (hover:none),(pointer:coarse)','[data-motion="reduce"]']:
    if marker not in css:errors.append(f'visual CSS marker missing: {marker}')
# cheap CSS syntax sanity
if css.count('{')!=css.count('}'):errors.append('visual CSS brace imbalance')

# Dictionary detail must set a useful image alt.
dictjs=txt('assets/js/dictionary.js')
if "medical illustration`" not in dictjs:errors.append('Dictionary detail image alt text not set')

# Seven-language strings for new visual controls.
i18n=txt('assets/js/i18n.js')
for lang in ['P.ps','P.prs','P.fa','P.ar','P.tr','P.zh']:
    if lang not in i18n:errors.append(f'i18n map missing {lang}')
for phrase in ["'Interactive visual'","'Zoom out'","'Zoom in'","'Toggle gentle auto rotation'","'Reset illustration'"]:
    if phrase not in i18n:errors.append(f'Phase 16 translation phrase missing: {phrase}')

# PWA/offline coherence.
packs=jsn('data/offline-packs.json');off=txt('assets/js/offline-packs.js');up=txt('assets/js/update-manager.js');sw=txt('sw.js')
if packs.get('version')!=ver.get('version'):errors.append('offline packs version != app version')
pm=re.match(r'smd-v21-phase(\d+)-pack-$',str(packs.get('cache_prefix',''))); sm=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw); om=re.search(r"const prefix='smd-v21-phase(\d+)-pack-'",off)
if not pm or int(pm.group(1))<16:errors.append('offline cache must remain Phase 16 or newer')
if not sm or int(sm.group(1))<16:errors.append('Service Worker must remain Phase 16 or newer')
if not om or not pm or om.group(1)!=pm.group(1):errors.append('offline runtime cache prefix mismatch')
if not sm or not pm or sm.group(1)!=pm.group(1):errors.append('Service Worker/offline cache phase mismatch')
if f"const CURRENT_VERSION='{ver.get('version')}'" not in up:errors.append('update manager version mismatch')
dp=next((x for x in packs.get('packs',[]) if x.get('id')=='dictionary'),{})
for u in ['./assets/css/visual-polish.css','./assets/js/visual-polish.js']:
    if u not in dp.get('urls',[]):errors.append(f'Dictionary pack missing {u}')

def local_path(u):
    clean=u.split('?',1)[0].split('#',1)[0]
    if clean in ('','./'):return None
    if clean.startswith('./'):clean=clean[2:]
    return root/clean
for sec in [packs.get('core',{})]+packs.get('packs',[]):
    urls=sec.get('urls',[])
    if sec.get('files')!=len(urls):errors.append(f"offline files mismatch: {sec.get('id','core')}")
    total=0
    for u in urls:
        p=local_path(u)
        if p is not None:
            if not p.is_file():errors.append(f'offline URL missing: {u}')
            else:total+=p.stat().st_size
    if sec.get('bytes')!=total:errors.append(f"offline bytes mismatch {sec.get('id','core')}: {sec.get('bytes')} != {total}")

# JS syntax checks.
for rel in ['assets/js/visual-polish.js','assets/js/dictionary.js','assets/js/i18n.js','assets/js/update-manager.js','assets/js/offline-packs.js']:
    r=subprocess.run(['node','--check',rel],cwd=root,capture_output=True,text=True)
    if r.returncode:errors.append(f'JS syntax failed {rel}: {(r.stderr or r.stdout).strip()}')

# App duplicate IDs and local references.
class P(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        k={'script':'src','link':'href','img':'src','a':'href'}.get(tag)
        if k and a.get(k):self.refs.append(a[k])
pr=P();pr.feed(app)
dup={x for x in pr.ids if pr.ids.count(x)>1}
if dup:errors.append(f'app.html duplicate IDs: {sorted(dup)}')
for ref in pr.refs:
    if ref.startswith(('http:','https:','mailto:','tel:','javascript:','#','data:')):continue
    clean=ref.split('?',1)[0].split('#',1)[0]
    if clean and not (root/clean).exists():errors.append(f'app.html missing local ref {ref}')

wf=txt('.github/workflows/deploy-pages.yml')
if 'python verify_phase16.py' not in wf:errors.append('workflow does not run Phase 16 verifier')
if not ('Phase 16' in wf.splitlines()[0] or 'Final Release' in wf.splitlines()[0] or 'Post-Release' in wf.splitlines()[0]):errors.append('workflow name must identify Phase 16-or-later final/post-release deployment')

# Production build must include the visual runtime and hash it.
r=subprocess.run([sys.executable,'tools/build_release.py'],cwd=root,capture_output=True,text=True)
if r.returncode:errors.append(f'production build failed: {(r.stderr or r.stdout).strip()}')
else:
    for f in ['assets/css/visual-polish.css','assets/js/visual-polish.js']:
        if not (root/'_site'/f).is_file():errors.append(f'production build missing {f}')
    man=jsn('_site/release-manifest.json')
    paths={x.get('path') for x in man.get('files',[])}
    for f in ['assets/css/visual-polish.css','assets/js/visual-polish.js']:
        if f not in paths:errors.append(f'release manifest missing {f}')

if errors:
    print('PHASE 16 VERIFY FAIL')
    for e in errors:print('-',e)
    sys.exit(1)
print('PHASE 16 VERIFY PASS')
print('Dictionary visual polish: PASS')
print('Drag/tilt/zoom keyboard + touch controls: PASS')
print('Reduced-motion behavior: PASS')
print('Offline Dictionary pack visual runtime: PASS')
print('Production artifact inclusion: PASS')
