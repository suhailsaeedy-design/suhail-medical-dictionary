from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
try:
    import yaml
except Exception:
    yaml=None
root=Path(__file__).resolve().parent
errors=[];notes=[]
required=['offline.html','assets/css/offline-packs.css','assets/js/offline-packs.js','data/offline-packs.json','assets/js/pwa.js','sw.js','manifest.webmanifest','version.json','verify_phase5.py','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json'); packs=load('data/offline-packs.json'); manifest=load('manifest.webmanifest')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv[0]!=21 or vv<(21,4,0): errors.append('version.json must be v21.4.0 or newer for Phase 5')
except Exception:errors.append('version.json semantic version invalid')
try:
    pv=tuple(int(x) for x in str(packs.get('version','0.0.0')).split('.'))
    if pv<(21,4,0) or pv[0]!=21: errors.append('offline pack metadata must be v21.4.0 or newer')
except Exception: errors.append('offline pack metadata semantic version invalid')
plist=packs.get('packs',[])
if [p.get('id') for p in plist]!=['dictionary','anatomy','study']:errors.append('expected dictionary/anatomy/study pack order')
if not str(packs.get('cache_prefix','')).startswith('smd-v21-phase') or not str(packs.get('cache_prefix','')).endswith('-pack-'):errors.append('pack cache prefix mismatch')
# Every declared offline URL must exist and byte totals for optional packs must be exact.
def local_path(url):
    clean=url.split('?',1)[0].split('#',1)[0]
    if clean in ('./',''):return root
    if clean.startswith('./'):clean=clean[2:]
    return root/clean
for section in [packs.get('core',{})]+plist:
    urls=section.get('urls',[])
    if len(urls)!=len(set(urls)):errors.append(f"duplicate URL in {section.get('id','core')} pack")
    for u in urls:
        if not local_path(u).exists():errors.append(f"offline pack missing local file: {u}")
for p in plist:
    actual=sum(local_path(u).stat().st_size for u in p.get('urls',[]) if local_path(u).is_file())
    if actual!=p.get('bytes'):errors.append(f"{p.get('id')} byte total mismatch {p.get('bytes')} != {actual}")
core_urls=packs.get('core',{}).get('urls',[])
for u in ['./offline.html','./assets/css/offline-packs.css','./assets/js/offline-packs.js','./assets/js/pwa.js','./data/offline-packs.json','./index.html','./privacy.html','./terms.html']:
    if u not in core_urls:errors.append(f'core shell missing {u}')
# Pack dependency invariants
expected={
'dictionary':['./app.html','./assets/js/dictionary.js','./assets/js/clinical-reference.js','./data/index.json','./data/clinical-reference.json','./data/clinical-calculators.json'],
'anatomy':['./anatomy.html','./assets/js/anatomy.js','./data/anatomy/catalog.json','./assets/models/skeleton-model.json','./assets/models/muscles-model.json'],
'study':['./ai.html','./assets/js/study-engine.js','./assets/js/ai-study.js','./data/index.json','./data/ai-config.json']}
byid={p.get('id'):p for p in plist}
for pid,urls in expected.items():
    for u in urls:
        if u not in byid.get(pid,{}).get('urls',[]):errors.append(f'{pid} pack missing {u}')
# HTML duplicate IDs + local refs
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
for fn in ['app.html','anatomy.html','ai.html']:
    s=(root/fn).read_text(encoding='utf-8')
    if 'href="offline.html"' not in s:errors.append(f'{fn} missing Offline Packs shared-shell link')
off=(root/'offline.html').read_text(encoding='utf-8')
for marker in ['installedPackCount','offlineCoverage','installNow','downloadAll','removeAll','storageBar','packGrid','data-i18n="offlinePacks"']:
    if marker not in off:errors.append(f'offline.html missing {marker}')
# Runtime contract
js=(root/'assets/js/offline-packs.js').read_text(encoding='utf-8'); pwa=(root/'assets/js/pwa.js').read_text(encoding='utf-8'); sw=(root/'sw.js').read_text(encoding='utf-8')
for marker in ["'caches'in window",'caches.open','cache.put','caches.delete','navigator.storage?.estimate','navigator.onLine','await cache.match']:
    if marker not in js:errors.append(f'offline pack runtime missing {marker}')
if 'await caches.delete(cacheName(id))' not in js:errors.append('transactional cleanup marker missing')
for marker in ['beforeinstallprompt','deferredPrompt.prompt()','appinstalled','display-mode: standalone','navigator.standalone']:
    if marker not in pwa:errors.append(f'central PWA installer missing {marker}')
# no legacy duplicate install handlers remain
for f in ['assets/js/dictionary.js','assets/js/anatomy.js','assets/js/ai-study.js','assets/js/login.js']:
    s=(root/f).read_text(encoding='utf-8')
    if re.search(r'(installBtn|installLogin).*addEventListener',s):errors.append(f'legacy install click handler remains in {f}')
# Service Worker core/pack semantics
m=re.search(r"const VERSION='([^']+)'",sw)
if not m or not m.group(1).startswith('smd-v21-phase'):errors.append('service worker version mismatch')
else:
    expected_prefix=m.group(1)+'-pack-'
    if packs.get('cache_prefix')!=expected_prefix:errors.append('service worker/pack cache prefix mismatch')
if "const PACK_PREFIX=VERSION+'-pack-'" not in sw:errors.append('service worker pack prefix missing')
if not re.search(r'caches\.match\((?:e|event|request)\.request|caches\.match\(request',sw):errors.append('service worker cache matching contract missing')
if "caches.match('./offline.html')" not in sw:errors.append('offline navigation fallback missing')
if 'c.put(e.request' in sw:errors.append('service worker should not silently runtime-cache optional pack resources')
for u in core_urls:
    if repr(u) not in sw:errors.append(f'service worker core missing {u}')
# manifest
if manifest.get('display')!='standalone':errors.append('manifest display must be standalone')
if manifest.get('id')!='./':errors.append('manifest id missing')
short=[x.get('url') for x in manifest.get('shortcuts',[])]
if './offline.html' not in short:errors.append('manifest Offline Packs shortcut missing')
# workflow
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase5.py' not in wf:errors.append('workflow does not run Phase 5 verifier')
if yaml:
    try:
        y=yaml.safe_load(wf)
        if not isinstance(y,dict) or 'jobs' not in y:errors.append('workflow YAML missing jobs')
    except Exception as e:errors.append(f'workflow YAML invalid: {e}')
else:notes.append('PyYAML unavailable; YAML parse skipped')
# Syntax/parse
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax skipped')
# legacy runtime ban
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['offline.html','assets/css/offline-packs.css','assets/js/offline-packs.js','assets/js/pwa.js'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-shell','v20-offline']:
    if banned in joined:errors.append(f'legacy runtime reference {banned}')
if errors:
    print('PHASE 5 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 5 VERIFY PASS')
print('packs:',[(p['id'],len(p['urls']),p['bytes']) for p in plist])
print('core files:',len(core_urls))
for n in notes:print('NOTE:',n)
