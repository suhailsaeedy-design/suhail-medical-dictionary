#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parent; E=[]
def read(p): return (R/p).read_text(encoding='utf-8')
def load(p): return json.loads(read(p))
V=load('version.json'); A=load('data/auth-config.json'); P=load('data/offline-packs.json')
if V.get('version')!='21.21.0': E.append('version must be 21.21.0')
if not (A.get('enabled') and A.get('sync',{}).get('enabled')): E.append('live auth/sync must be enabled')
if A.get('supabaseUrl')!='https://qdfylefkkkyjwtqqiuye.supabase.co': E.append('wrong Supabase project URL')
if not str(A.get('publishableKey','')).startswith('sb_publishable_'): E.append('modern publishable key missing')
if A.get('security',{}).get('allowServiceRoleInBrowser') is not False: E.append('service role browser flag unsafe')
if re.search(r'(service_role|sb_secret_)\s*[:=]\s*["\'][A-Za-z0-9_-]{12,}',read('data/auth-config.json'),re.I): E.append('privileged key leaked')
ca=read('assets/js/cloud-auth.js'); lg=read('assets/js/login.js'); sh=read('assets/js/shell-navigation.js'); off=read('assets/js/offline-packs.js'); about=read('about.html')
for m in ['chooseAnother','prompt','select_account','clearSession']:
    if m not in ca:E.append('account-switch marker missing '+m)
if 'beginGoogle(true)' not in lg or 'beginGoogle(false)' not in lg:E.append('current/other account paths not separated')
if 'shellSidebarSignout' not in sh or 'SMD21Auth?.signOut' not in sh:E.append('sidebar logout wiring missing')
for m in ['requestPersistentStorage','verifyAll','Full offline library is ready']:
    if m not in off:E.append('full offline marker missing '+m)
if 'suhail-saeedi-creator.webp' not in about:E.append('creator portrait not wired')
for m in ['Software &amp; Web Developer','Business Software','Database Systems','AI Integration','Building Smart Digital Systems']:
    if m not in about:E.append('creator bio marker missing '+m)
if not (R/'assets/images/suhail-saeedi-creator.webp').is_file():E.append('creator portrait file missing')
if P.get('version')!=V.get('version'):E.append('offline version mismatch')
if P.get('cache_prefix')!='smd-v21-phase23-pack-':E.append('offline prefix mismatch')
if './assets/images/suhail-saeedi-creator.webp' not in P['core']['urls']:E.append('portrait missing from core offline shell')
if "const VERSION='smd-v21-phase23'" not in read('sw.js'):E.append('service worker phase23 cache missing')
if "const CURRENT_VERSION='21.21.0'" not in read('assets/js/update-manager.js'):E.append('update manager version mismatch')
# offline byte/file integrity
for sec in [P['core']]+P['packs']:
    total=0
    for u in sec['urls']:
        q=u.split('?',1)[0].split('#',1)[0]
        if q in ('','./'):continue
        f=R/(q[2:] if q.startswith('./') else q)
        if not f.is_file():E.append('offline file missing '+u)
        else:total+=f.stat().st_size
    if sec.get('files')!=len(sec['urls']):E.append('offline file count mismatch '+sec.get('id','core'))
    if sec.get('bytes')!=total:E.append(f"offline bytes mismatch {sec.get('id','core')}: {sec.get('bytes')} != {total}")
for f in ['assets/js/cloud-auth.js','assets/js/login.js','assets/js/shell-navigation.js','assets/js/offline-packs.js','sw.js']:
    r=subprocess.run(['node','--check',f],cwd=R,capture_output=True,text=True)
    if r.returncode:E.append('JS syntax failed '+f)
r=subprocess.run([sys.executable,'tools/build_release.py'],cwd=R,capture_output=True,text=True,timeout=120)
if r.returncode:E.append('production build failed '+(r.stderr or r.stdout).strip())
else:
    site=R/'_site'
    for f in ['data/auth-config.json','assets/images/suhail-saeedi-creator.webp','assets/js/offline-packs.js']:
        if not (site/f).is_file():E.append('production missing '+f)
wf=read('.github/workflows/deploy-pages.yml')
if 'python verify_phase19.py' not in wf:E.append('workflow missing Phase19 verifier')
if E:
    print('PHASE19_FAIL'); [print('-',x) for x in E]; raise SystemExit(1)
print('PHASE19_PASS account switching + logout + full offline + creator profile + live cloud sync activation')
