#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parent
E=[]
def read(x): return (R/x).read_text(encoding='utf-8')
def load(x): return json.loads(read(x))
req=['version.json','owner-setup.html','assets/js/owner-setup.js','assets/js/cloud-auth.js','data/auth-config.json','data/admin-config.json','supabase/phase21_owner_bootstrap.sql','tools/build_release.py','.github/workflows/deploy-pages.yml']
for f in req:
    if not (R/f).is_file(): E.append('missing '+f)
v=load('version.json'); a=load('data/auth-config.json'); ad=load('data/admin-config.json'); packs=load('data/offline-packs.json')
if v.get('version')!='21.20.0': E.append('version != 21.20.0')
if a.get('version')!='21.20.0': E.append('auth config version mismatch')
if ad.get('version')!='21.20.0': E.append('admin config version mismatch')
if a.get('enabled') is not True or a.get('provider')!='google': E.append('live Google auth missing')
if a.get('sync',{}).get('enabled') is not True or a.get('sync',{}).get('table')!='user_app_state': E.append('live sync missing')
if a.get('security',{}).get('allowServiceRoleInBrowser') is not False: E.append('service-role browser guard missing')
if not str(a.get('publishableKey','')).startswith('sb_publishable_'): E.append('publishable key format invalid')
if ad.get('cloudAdmin',{}).get('enabled') is not True: E.append('cloud admin must be enabled for role-gated Phase21')
if ad.get('cloudAdmin',{}).get('roleClaim')!='smd_role': E.append('admin role claim mismatch')
if set(ad.get('cloudAdmin',{}).get('allowedRoles',[]))!={'owner','admin'}: E.append('admin allowed roles mismatch')
if ad.get('privacy',{}).get('showRawUserState') is not False or ad.get('privacy',{}).get('showOtherUserEmails') is not False: E.append('admin privacy boundary weakened')
html=read('owner-setup.html'); js=read('assets/js/owner-setup.js'); cloud=read('assets/js/cloud-auth.js'); sql=read('supabase/phase21_owner_bootstrap.sql')
for marker in ['Owner Bootstrap & Publish Gate','ownerBootstrapCode','claimOwnerRole','publishGateStatus','openAdminConsole']:
    if marker not in html: E.append('owner setup html missing '+marker)
for marker in ['smd_claim_owner','refreshSession','smd_role','gateSync','gateMetrics','PUBLISH GATE PASS']:
    if marker not in js: E.append('owner setup runtime missing '+marker)
if 'refreshSession' not in cloud.split('window.SMD21CloudAuth=',1)[-1]: E.append('cloud auth does not export refreshSession')
for marker in ['private.owner_bootstrap','extensions.digest','auth.uid()','raw_app_meta_data','smd_role','used_at','owner already assigned','revoke all on table private.owner_bootstrap','security invoker']:
    if marker not in sql: E.append('phase21 SQL missing '+marker)
# No plaintext bootstrap code may be committed.
pattern=re.compile(r'SMD-(?:[0-9A-F]{4}-){5,}[0-9A-F]{4}')
for p in R.rglob('*'):
    if not p.is_file() or '_site' in p.parts or p.suffix.lower() in {'.png','.webp','.ico','.zip'}: continue
    try:s=p.read_text(encoding='utf-8')
    except:continue
    if pattern.search(s): E.append('plaintext owner bootstrap code leaked into '+str(p.relative_to(R)))
if 'owner-setup.html' not in read('tools/build_release.py'): E.append('production builder does not include owner setup route')
wf=read('.github/workflows/deploy-pages.yml')
if 'v21.20 Owner Bootstrap' not in wf: E.append('workflow name mismatch')
if 'python verify_phase21.py' not in wf: E.append('workflow missing phase21 verifier')
if packs.get('version')!='21.20.0' or packs.get('cache_prefix')!='smd-v21-phase21-pack-': E.append('offline release metadata mismatch')
if "const VERSION='smd-v21-phase21'" not in read('sw.js'): E.append('service worker version mismatch')
if "const CURRENT_VERSION='21.20.0'" not in read('assets/js/update-manager.js'): E.append('update manager version mismatch')
if "const prefix='smd-v21-phase21-pack-'" not in read('assets/js/offline-packs.js'): E.append('offline runtime prefix mismatch')
# owner setup intentionally not in core offline cache
if './owner-setup.html' in packs.get('core',{}).get('urls',[]): E.append('owner setup should not be pre-cached in core offline shell')
# production build
r=subprocess.run([sys.executable,'tools/build_release.py'],cwd=R,capture_output=True,text=True,timeout=120)
if r.returncode:E.append('production build failed: '+(r.stderr or r.stdout).strip())
else:
    S=R/'_site'
    if not (S/'owner-setup.html').is_file(): E.append('owner setup missing from production artifact')
    if (S/'supabase').exists(): E.append('supabase private/setup SQL leaked into production artifact')
    if any(S.glob('verify_phase*.py')): E.append('verifiers leaked into production artifact')
for f in ['assets/js/owner-setup.js','assets/js/cloud-auth.js','assets/js/admin-auth.js','assets/js/admin-login.js','assets/js/admin.js','sw.js']:
    q=subprocess.run(['node','--check',f],cwd=R,capture_output=True,text=True)
    if q.returncode:E.append('JS syntax failed '+f+': '+q.stderr.strip())
if E:
    print('PHASE21_FAIL')
    for x in E: print('-',x)
    raise SystemExit(1)
print('PHASE21_PASS one-time Owner bootstrap + role-gated Cloud Admin + Publish Gate')
