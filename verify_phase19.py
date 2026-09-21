#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parent
E=[]
def read(x): return (R/x).read_text(encoding='utf-8')
def load(x): return json.loads(read(x))
required=['data/auth-config.json','assets/js/cloud-auth.js','assets/js/cloud-sync.js','assets/js/cloud-readiness.js','version.json','data/offline-packs.json','sw.js','.github/workflows/deploy-pages.yml','CLOUD_ACTIVATION_DEPLOYMENT_GUIDE_PASHTO.md']
for f in required:
    if not (R/f).is_file(): E.append('missing '+f)
v=load('version.json'); c=load('data/auth-config.json'); packs=load('data/offline-packs.json')

try:
    vv=tuple(map(int,str(v.get('version','0.0.0')).split('.')))
    if vv < (21,18,0): E.append('version must be 21.18.0 or newer')
except Exception: E.append('invalid semantic version')
if c.get('version')!=v.get('version'):E.append('auth config version mismatch')
if c.get('enabled') is not True:E.append('live cloud auth must be enabled')
if c.get('provider')!='google':E.append('provider must be google')
if c.get('supabaseUrl')!='https://qdfylefkkkyjwtqqiuye.supabase.co':E.append('unexpected Supabase project URL')
key=str(c.get('publishableKey',''))
if not key.startswith('sb_publishable_'):E.append('browser config must use modern publishable key')
if re.search(r'(?i)service[_-]?role|sb_secret_',key):E.append('secret/service role key detected')
if c.get('sync',{}).get('enabled') is not True or c.get('sync',{}).get('table')!='user_app_state':E.append('cloud sync config incomplete')
if c.get('security',{}).get('allowServiceRoleInBrowser') is not False:E.append('allowServiceRoleInBrowser must be false')
if c.get('security',{}).get('sessionStorageOnly') is not True:E.append('cloud session must remain sessionStorage-only')
site='https://suhailsaeedy-design.github.io/suhail-medical-dictionary/'
if c.get('productionSiteUrl')!=site:E.append('production site URL mismatch')
ca=read('assets/js/cloud-auth.js'); cr=read('assets/js/cloud-readiness.js'); cs=read('assets/js/cloud-sync.js')
for m in ['productionSiteUrl','/auth/v1/authorize','prompt','select_account','/auth/v1/user','/auth/v1/logout']:
    if m not in ca:E.append('cloud auth marker missing: '+m)
for m in ['user_app_state','Authorization:`Bearer','resolution=merge-duplicates']:
    if m not in cs:E.append('cloud sync marker missing: '+m)
if '/auth/v1/settings' not in cr:E.append('readiness Auth settings check missing')
if packs.get('version')!=v.get('version'):E.append('offline pack version mismatch')
m=re.match(r'^smd-v21-phase(\d+)-pack-$',str(packs.get('cache_prefix','')));
if not m or int(m.group(1))<19:E.append('offline prefix mismatch')
m=re.search(r"const VERSION='smd-v21-phase(\d+)'",read('sw.js'));
if not m or int(m.group(1))<19:E.append('SW phase19+ mismatch')
if f"const CURRENT_VERSION='{v.get('version')}'" not in read('assets/js/update-manager.js'):E.append('update manager mismatch')
if f"const prefix='{packs.get('cache_prefix')}'" not in read('assets/js/offline-packs.js'):E.append('offline runtime prefix mismatch')
# exact offline bytes/files
for sec in [packs.get('core',{})]+packs.get('packs',[]):
    urls=sec.get('urls',[]); total=0
    for u in urls:
        q=u.split('?',1)[0].split('#',1)[0]
        if q in ('','./'): continue
        p=R/(q[2:] if q.startswith('./') else q)
        if not p.is_file():E.append('offline URL missing '+u)
        else:total+=p.stat().st_size
    if sec.get('files')!=len(urls):E.append('offline file count mismatch '+str(sec.get('id','core')))
    if sec.get('bytes')!=total:E.append(f"offline bytes mismatch {sec.get('id','core')}: {sec.get('bytes')} != {total}")
# production build + no secret key patterns
for f in ['data/auth-config.json','assets/js/cloud-auth.js','assets/js/cloud-sync.js','assets/js/cloud-readiness.js']:
    if re.search(r'\bsb_secret_[A-Za-z0-9_-]{8,}',read(f)):E.append('secret key leaked: '+f)
r=subprocess.run([sys.executable,'tools/build_release.py'],cwd=R,capture_output=True,text=True,timeout=120)
if r.returncode:E.append('production build failed: '+(r.stderr or r.stdout).strip())
else:
    sitep=R/'_site'
    live=json.loads((sitep/'data/auth-config.json').read_text())
    if live.get('enabled') is not True or not str(live.get('publishableKey','')).startswith('sb_publishable_'):E.append('production auth config not activated')
    if not (sitep/'assets/js/cloud-sync.js').is_file():E.append('cloud sync runtime missing from production')
for f in ['assets/js/cloud-auth.js','assets/js/cloud-sync.js','assets/js/cloud-readiness.js','assets/js/update-manager.js','assets/js/offline-packs.js','sw.js']:
    q=subprocess.run(['node','--check',f],cwd=R,capture_output=True,text=True)
    if q.returncode:E.append('JS syntax failed '+f+': '+q.stderr.strip())
if E:
    print('PHASE19_FAIL')
    for x in E:print('-',x)
    raise SystemExit(1)
print('PHASE19_PASS live Supabase Google auth + per-user cloud sync activation')
