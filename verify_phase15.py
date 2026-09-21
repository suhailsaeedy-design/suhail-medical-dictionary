from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
root=Path(__file__).resolve().parent
errors=[]

def load_json(rel):
    try:return json.loads((root/rel).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{rel} invalid JSON: {e}');return {}

def text(rel):
    try:return (root/rel).read_text(encoding='utf-8')
    except Exception as e:errors.append(f'missing/read error {rel}: {e}');return ''

required=['assets/css/shell-navigation.css','assets/js/shell-navigation.js','verify_phase15.py','PHASE15_REPORT_PASHTO.md','version.json','sw.js','data/offline-packs.json','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file():errors.append(f'missing {f}')

ver=load_json('version.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv<(21,14,0) or vv[0]!=21:errors.append('Phase 15 requires v21.14.0 or newer')
except Exception:errors.append('version.json semantic version invalid')
if 'Phase 15' not in str(ver.get('scope','')):errors.append('Phase 15 responsive shell missing from release scope')
if 'Phase 15' not in str(ver.get('scope','')):errors.append('Phase 15 missing from version scope')

pages=['app.html','anatomy.html','ai.html','offline.html','settings.html','about.html']
expected=['Home','Dictionary','3D Anatomy','AI Study','More']
for f in pages:
    s=text(f)
    if 'assets/css/shell-navigation.css' not in s:errors.append(f'{f}: shell navigation CSS missing')
    if 'assets/js/shell-navigation.js' not in s:errors.append(f'{f}: shell navigation JS missing')
    m=re.search(r'<nav class="[^"]*bottom-nav[^"]*"[^>]*>(.*?)</nav>',s,re.S)
    if not m:errors.append(f'{f}: mobile bottom nav missing');continue
    labels=re.findall(r'class="shell-nav-label">([^<]+)',m.group(1))
    if labels!=expected:errors.append(f'{f}: bottom nav must be exactly {expected}, got {labels}')
    if any(x in labels for x in ['Bookmarks','History','Selected']):errors.append(f'{f}: legacy study-state items leaked into canonical bottom nav')

app=text('app.html')
if '<section class="hero" id="home">' not in app:errors.append('app.html missing Home anchor on hero')
settings=text('settings.html')
if 'id="backupRestore"' not in settings:errors.append('settings backup/restore deep-link anchor missing')

shell=text('assets/js/shell-navigation.js')
markers=[
    "navItem('home','app.html#home'", "navItem('dictionary','app.html#dictionary'", "navItem('anatomy','anatomy.html'", "navItem('ai','ai.html'", "navItem('more',''",
    'app.html#selected','app.html#bookmarks','app.html#history','offline.html','settings.html#backupRestore','data-shell-signout',
    "aria-haspopup','menu'", "stopImmediatePropagation()", "role=\"menuitem\"", "data-shell-more", "aria-expanded"
]
for m in markers:
    if m not in shell:errors.append(f'shell navigation runtime marker missing: {m}')

# Dictionary same-document hash navigation must be functional without forcing a reload.
dictjs=text('assets/js/dictionary.js')
for m in ['function applyHashMode','window.addEventListener(\'hashchange\'','raw===\'home\'','validModes.has(raw)']:
    if m not in dictjs:errors.append(f'dictionary same-page navigation marker missing: {m}')

# Seven-language additions for the new shared labels.
i18n=text('assets/js/i18n.js')
for lang in ['P.ps','P.prs','P.fa','P.ar','P.tr','P.zh']:
    if lang not in i18n:errors.append(f'i18n language map missing {lang}')
for phrase in ["'Home'","'More'","'Account'","'Sign out'","'Medical learner · Account'"]:
    if phrase not in i18n:errors.append(f'i18n Phase 15 shared phrase missing: {phrase}')

# Account chip source wording must no longer promise an immediate sign-out action.
for f in pages:
    s=text(f)
    if 'Medical learner · Sign out' in s:errors.append(f'{f}: stale direct-signout account-chip wording')
    if 'title="Sign out"' in s:errors.append(f'{f}: stale direct-signout account-chip title')

# PWA/offline coherence.
packs=load_json('data/offline-packs.json');sw=text('sw.js');off=text('assets/js/offline-packs.js');up=text('assets/js/update-manager.js')
if packs.get('version')!=ver.get('version'):errors.append('offline packs version != app version')
m=re.fullmatch(r'smd-v21-phase(\d+)-pack-',str(packs.get('cache_prefix','')));
if not m or int(m.group(1))<15:errors.append('Phase 15+ offline cache prefix mismatch')
m=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw);
if not m or int(m.group(1))<15:errors.append('Service Worker older than Phase 15')
m=re.search(r"const prefix='smd-v21-phase(\d+)-pack-'",off);
if not m or int(m.group(1))<15:errors.append('offline pack runtime older than Phase 15')
if f"const CURRENT_VERSION='{ver.get('version')}'" not in up:errors.append('update manager version mismatch')
core=packs.get('core',{});urls=core.get('urls',[])
for u in ['./assets/css/shell-navigation.css','./assets/js/shell-navigation.js']:
    if u not in urls:errors.append(f'Core Offline Shell missing {u}')
    if repr(u) not in sw:errors.append(f'Service Worker core missing {u}')
if core.get('files')!=len(urls):errors.append('Core Offline Shell file count mismatch')

def local_path(url):
    clean=url.split('?',1)[0].split('#',1)[0]
    if clean in ('','./'):return None
    if clean.startswith('./'):clean=clean[2:]
    return root/clean
for sec in [core]+packs.get('packs',[]):
    us=sec.get('urls',[])
    if sec.get('files')!=len(us):errors.append(f"offline files mismatch: {sec.get('id','core')}")
    total=0
    for u in us:
        p=local_path(u)
        if p is not None:
            if not p.is_file():errors.append(f'offline URL missing: {u}')
            else:total+=p.stat().st_size
    if sec.get('bytes')!=total:errors.append(f"offline bytes mismatch {sec.get('id','core')}: {sec.get('bytes')} != {total}")

wf=text('.github/workflows/deploy-pages.yml')
if 'python verify_phase15.py' not in wf:errors.append('GitHub Pages workflow does not run Phase 15 verifier')
first=wf.splitlines()[0] if wf.splitlines() else ''
m=re.search(r'Phase (\d+)',first)
if not (('Final Release' in first) or ('Post-Release' in first) or (m and int(m.group(1))>=15)):errors.append('workflow name older than Phase 15/final/post-release')

# JS syntax for the changed runtime files.
for rel in ['assets/js/shell-navigation.js','assets/js/dictionary.js','assets/js/i18n.js','assets/js/update-manager.js','assets/js/offline-packs.js']:
    r=subprocess.run(['node','--check',rel],cwd=root,capture_output=True,text=True)
    if r.returncode:errors.append(f'JS syntax failed {rel}: {(r.stderr or r.stdout).strip()}')

# HTML duplicate-ID and local-ref sanity for the shell pages.
class Parser(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        k={'script':'src','link':'href','img':'src','a':'href'}.get(tag)
        if k and a.get(k):self.refs.append(a[k])
for f in pages:
    pr=Parser();pr.feed(text(f))
    dup={x for x in pr.ids if pr.ids.count(x)>1}
    if dup:errors.append(f'{f}: duplicate IDs {sorted(dup)}')
    for ref in pr.refs:
        if ref.startswith(('http:','https:','mailto:','tel:','javascript:','#','data:')):continue
        clean=ref.split('?',1)[0].split('#',1)[0]
        if not clean:continue
        target=(root/clean)
        if not target.exists():errors.append(f'{f}: missing local ref {ref}')

if errors:
    print('PHASE 15 VERIFY FAIL')
    for e in errors:print('-',e)
    sys.exit(1)
print('PHASE 15 VERIFY PASS')
print('Canonical mobile nav:', ' / '.join(expected))
print('Responsive shell pages:', len(pages))
print('Account menu + More sheet: PASS')
print('Same-page Dictionary hash navigation: PASS')
