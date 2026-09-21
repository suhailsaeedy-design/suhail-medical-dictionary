#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
R=Path(__file__).resolve().parent
E=[]
def read(x): return (R/x).read_text(encoding='utf-8')
def load(x): return json.loads(read(x))
# files
for f in ['assets/js/cloud-readiness.js','CLOUD_ACTIVATION_DEPLOYMENT_GUIDE_PASHTO.md','deployment/auth-config.example.json','settings.html','data/auth-config.json','data/offline-packs.json','sw.js','version.json']:
    if not (R/f).is_file(): E.append('missing '+f)
v=load('version.json')
if tuple(map(int,str(v.get('version','0.0.0')).split('.'))) < (21,17,0): E.append('version must be 21.17.0 or newer')
# Public-browser config must remain safe whether disabled or activated
c=load('data/auth-config.json')
if c.get('enabled') is True:
    if not str(c.get('supabaseUrl','')).startswith('https://') or not str(c.get('publishableKey','')).startswith('sb_publishable_'): E.append('activated config must use HTTPS + modern publishable key')
else:
    if c.get('supabaseUrl') or c.get('publishableKey'): E.append('disabled config must stay blank')
if c.get('security',{}).get('allowServiceRoleInBrowser') is not False: E.append('service role browser flag must be false')
# Example contains placeholders only
ex=load('deployment/auth-config.example.json')
if ex.get('enabled') is not True or 'YOUR_PROJECT_REF' not in ex.get('supabaseUrl',''): E.append('source example must use placeholders')
# UI/runtime markers
h=read('settings.html'); js=read('assets/js/cloud-readiness.js')
for m in ['id="cloudReadiness"','id="runCloudReadiness"','id="cloudCallbackUrl"','assets/js/cloud-readiness.js']:
    if m not in h:E.append('settings marker missing: '+m)
for m in ['/auth/v1/settings','allowServiceRoleInBrowser','sb_secret_','navigator.clipboard','redirectPath']:
    if m not in js:E.append('readiness runtime marker missing: '+m)
# No service role/secret values in public config/runtime
for f in ['data/auth-config.json','assets/js/cloud-readiness.js','assets/js/cloud-auth.js']:
    t=read(f)
    if re.search(r'\bsb_secret_[A-Za-z0-9_-]{12,}',t): E.append('secret-like Supabase key in '+f)
# Offline/PWA inclusion
packs=load('data/offline-packs.json')
if packs.get('version')!=v.get('version'):E.append('offline version mismatch')
pm=re.match(r'smd-v21-phase(\d+)-pack-$',str(packs.get('cache_prefix','')))
if not pm or int(pm.group(1))<18:E.append('offline prefix must be phase18 or newer')
core=packs.get('core',{}).get('urls',[])
if './assets/js/cloud-readiness.js' not in core:E.append('cloud readiness missing from core offline shell')
sw=read('sw.js')
sm=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
if not sm or int(sm.group(1))<18:E.append('SW phase18-or-newer version missing')
if './assets/js/cloud-readiness.js' not in sw:E.append('SW core missing cloud readiness')
# Byte/file integrity
def target(u):
    q=u.split('?',1)[0].split('#',1)[0]
    if q in ('','./'): return None
    return R/(q[2:] if q.startswith('./') else q)
for sec in [packs.get('core',{})]+packs.get('packs',[]):
    urls=sec.get('urls',[]); total=0
    for u in urls:
        p=target(u)
        if p is not None and not p.is_file():E.append('offline URL missing '+u)
        elif p is not None:total+=p.stat().st_size
    if sec.get('files')!=len(urls):E.append('offline file count mismatch '+str(sec.get('id','core')))
    if sec.get('bytes')!=total:E.append(f"offline bytes mismatch {sec.get('id','core')}: {sec.get('bytes')} != {total}")
# Production artifact excludes source-only deployment guide/example after build
r=subprocess.run([sys.executable,'tools/build_release.py'],cwd=R,capture_output=True,text=True,timeout=120)
if r.returncode:E.append('production build failed: '+(r.stderr or r.stdout).strip())
else:
    site=R/'_site'
    if (site/'deployment').exists():E.append('deployment templates leaked into production')
    if (site/'CLOUD_ACTIVATION_DEPLOYMENT_GUIDE_PASHTO.md').exists():E.append('source guide leaked into production')
    if not (site/'assets/js/cloud-readiness.js').is_file():E.append('runtime cloud readiness missing from production')
# syntax
for f in ['assets/js/cloud-readiness.js','assets/js/cloud-auth.js','assets/js/cloud-sync.js','sw.js']:
    q=subprocess.run(['node','--check',f],cwd=R,capture_output=True,text=True)
    if q.returncode:E.append('JS syntax failed '+f+': '+q.stderr.strip())
if E:
    print('PHASE18_FAIL')
    for x in E:print('-',x)
    raise SystemExit(1)
print('PHASE18_PASS cloud activation readiness + safe deployment configuration')
