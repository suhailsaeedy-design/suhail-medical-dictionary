from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys

root=Path(__file__).resolve().parent
errors=[]; notes=[]
required=[
    'tools/build_release.py','404.html','version.json','data/offline-packs.json','sw.js',
    'verify_phase14.py','PHASE14_REPORT_PASHTO.md','.github/workflows/deploy-pages.yml'
]
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')

def load(rel):
    try:return json.loads((root/rel).read_text(encoding='utf-8'))
    except Exception as e: errors.append(f'{rel} invalid JSON: {e}'); return {}

ver=load('version.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv<(21,13,0) or vv[0]!=21:errors.append('version.json must be v21.13.0 or newer for Phase 14')
except Exception: errors.append('version.json semantic version invalid')
if 'Phase 14' not in str(ver.get('scope','')):errors.append('version scope no longer records Phase 14 production build/deployment hardening')

wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
workflow_markers=[
    'jobs:', 'build:', 'deploy:', 'needs: build', 'python verify_phase14.py', 'python tools/build_release.py',
    'actions/configure-pages@v5', 'actions/upload-pages-artifact@v4', 'path: _site', 'actions/deploy-pages@v4',
    'pages: write', 'id-token: write', 'actions: read'
]
for m in workflow_markers:
    if m not in wf: errors.append(f'workflow Phase 14 marker missing: {m}')
if re.search(r'path:\s*[.][\s\n]',wf):errors.append('workflow must not deploy repository root')
if 'path: .' in wf:errors.append('workflow still uploads repository root instead of clean _site artifact')

build=(root/'tools/build_release.py').read_text(encoding='utf-8')
for m in ["OUT = ROOT / '_site'","RUNTIME_DIRS = ['assets','data']",'release-manifest.json','sha256','audit_site()','development path leaked into release']:
    if m not in build:errors.append(f'build script marker missing: {m}')

# Phase 14-or-newer cache/version coherence.
sw=(root/'sw.js').read_text(encoding='utf-8')
packs=load('data/offline-packs.json')
off=(root/'assets/js/offline-packs.js').read_text(encoding='utf-8')
up=(root/'assets/js/update-manager.js').read_text(encoding='utf-8')
sm=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw); pm=re.match(r'smd-v21-phase(\d+)-pack-$',str(packs.get('cache_prefix',''))); om=re.search(r"const prefix='smd-v21-phase(\d+)-pack-'",off); um=re.search(r"const CURRENT_VERSION='([^']+)'",up)
if not sm or int(sm.group(1))<14:errors.append('Service Worker cache must remain Phase 14 or newer')
if not pm or int(pm.group(1))<14:errors.append('offline pack prefix must remain Phase 14 or newer')
if not om or not pm or om.group(1)!=pm.group(1):errors.append('offline runtime prefix is not coherent with offline-packs.json')
if not sm or not pm or sm.group(1)!=pm.group(1):errors.append('Service Worker and offline pack cache phases are not coherent')
if not um or um.group(1)!=str(ver.get('version')):errors.append('update manager runtime version must match version.json')
if packs.get('version')!=ver.get('version'):errors.append('offline-packs.json version must match version.json')

# Existing offline metadata must remain exact after runtime version changes.
def local_path(url):
    clean=url.split('?',1)[0].split('#',1)[0]
    if clean in ('','./'): return None
    if clean.startswith('./'): clean=clean[2:]
    return root/clean
for sec in [packs.get('core',{})]+packs.get('packs',[]):
    urls=sec.get('urls',[])
    if sec.get('files')!=len(urls):errors.append(f"offline files count mismatch for {sec.get('id','core')}")
    total=0
    for u in urls:
        p=local_path(u)
        if p is not None:
            if not p.is_file(): errors.append(f'offline URL missing source file {u}')
            else: total+=p.stat().st_size
    if sec.get('bytes')!=total:errors.append(f"offline byte total mismatch for {sec.get('id','core')}: {sec.get('bytes')} != {total}")

# Build release and capture deterministic release-manifest bytes twice.
def run_build():
    r=subprocess.run([sys.executable,'tools/build_release.py'],cwd=root,capture_output=True,text=True,timeout=60)
    if r.returncode:
        errors.append('production build failed: '+(r.stderr or r.stdout).strip()); return None
    if 'PRODUCTION_BUILD_PASS' not in r.stdout:errors.append('production build did not emit PASS marker')
    p=root/'_site/release-manifest.json'
    return p.read_bytes() if p.is_file() else None
m1=run_build(); m2=run_build()
if m1 is None or m2 is None:errors.append('release manifest missing after production build')
elif m1!=m2:errors.append('production release manifest is not deterministic across consecutive builds')

site=root/'_site'
if site.is_dir():
    forbidden_roots={'.github','supabase','tools','__pycache__'}
    for name in forbidden_roots:
        if (site/name).exists():errors.append(f'development directory leaked into _site: {name}')
    for p in site.rglob('*'):
        if p.is_symlink():errors.append(f'symlink leaked into _site: {p.relative_to(site)}')
        if p.is_file() and (p.name.startswith('verify_phase') or p.name.startswith('PHASE') or p.suffix=='.py'):
            errors.append(f'development file leaked into _site: {p.relative_to(site)}')
    # Release manifest must exactly describe all deployed files except itself.
    try: manifest=json.loads((site/'release-manifest.json').read_text(encoding='utf-8'))
    except Exception as e: manifest={};errors.append(f'release manifest invalid: {e}')
    listed={x.get('path'):x for x in manifest.get('files',[]) if isinstance(x,dict)}
    actual={p.relative_to(site).as_posix():p for p in site.rglob('*') if p.is_file() and p.name!='release-manifest.json'}
    if set(listed)!=set(actual):
        errors.append(f'release manifest file set mismatch: listed={len(listed)} actual={len(actual)}')
    total=0
    for rel,p in actual.items():
        size=p.stat().st_size; total+=size
        h=hashlib.sha256(p.read_bytes()).hexdigest(); row=listed.get(rel,{})
        if row.get('bytes')!=size:errors.append(f'release manifest byte mismatch: {rel}')
        if row.get('sha256')!=h:errors.append(f'release manifest hash mismatch: {rel}')
    if manifest.get('file_count')!=len(actual):errors.append('release manifest file_count mismatch')
    if manifest.get('total_bytes')!=total:errors.append('release manifest total_bytes mismatch')
    if manifest.get('version')!=ver.get('version'):errors.append('release manifest version mismatch')
    if total>=10*1024*1024*1024:errors.append('Pages artifact exceeds 10GB limit')
    # Required runtime and 404 fallback.
    for f in ['index.html','app.html','anatomy.html','ai.html','offline.html','settings.html','404.html','sw.js','manifest.webmanifest','version.json','.nojekyll']:
        if not (site/f).is_file():errors.append(f'_site missing required runtime {f}')
    # Ensure source-only docs/config are not published.
    for f in ['README.md','PHASE13_REPORT_PASHTO.md','PHASE14_REPORT_PASHTO.md']:
        if (site/f).exists():errors.append(f'source documentation leaked into _site: {f}')
    # Manifest runtime references must be deployment-relative and present.
    webman=load('_site/manifest.webmanifest') if (site/'manifest.webmanifest').exists() else {}
    for key in ['start_url','scope']:
        val=str(webman.get(key,''))
        if val.startswith('/'):errors.append(f'webmanifest {key} must remain relative for project Pages')
    for icon in webman.get('icons',[]):
        src=str(icon.get('src',''))
        if src and not (site/src).is_file():errors.append(f'webmanifest icon missing: {src}')
    # No required remote JS/CSS dependencies in deployed HTML.
    for h in site.glob('*.html'):
        text=h.read_text(encoding='utf-8',errors='ignore')
        if re.search(r'<script[^>]+src=["\']https?://',text,re.I):errors.append(f'external runtime script in {h.name}')
        if re.search(r'<link[^>]+href=["\']https?://',text,re.I):errors.append(f'external runtime stylesheet in {h.name}')

# Auth config may be the original safe disabled checkpoint or a later live activation using only browser-safe values.
auth=load('data/auth-config.json')
if auth.get('enabled') is True:
    if not str(auth.get('supabaseUrl','')).startswith('https://'):errors.append('enabled auth config requires HTTPS Supabase URL')
    if not str(auth.get('publishableKey','')).startswith('sb_publishable_'):errors.append('enabled auth config requires browser-safe publishable key')
    if re.search(r'(?i)service[_-]?role|sb_secret_',str(auth.get('publishableKey',''))):errors.append('secret/service-role key must not ship in browser config')
elif auth.get('enabled') is False:
    if auth.get('supabaseUrl') or auth.get('publishableKey'):errors.append('disabled auth config should remain blank')
else: errors.append('auth enabled flag invalid')
if auth.get('security',{}).get('allowServiceRoleInBrowser') is not False:errors.append('service-role browser access must remain false')

if errors:
    print('PHASE 14 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 14 VERIFY PASS')
if site.is_dir():
    man=json.loads((site/'release-manifest.json').read_text(encoding='utf-8'))
    print('Production artifact:',man.get('file_count'),'files /',man.get('total_bytes'),'bytes')
    print('Release manifest integrity: PASS')
    print('Deterministic consecutive build: PASS')
