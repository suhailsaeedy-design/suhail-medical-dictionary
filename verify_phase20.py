#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parent
E=[]
def read(x): return (R/x).read_text(encoding='utf-8')
def load(x): return json.loads(read(x))

required=[
 'version.json','data/auth-config.json','data/admin-config.json','data/ai-config.json',
 'data/offline-packs.json','sw.js','assets/js/update-manager.js','assets/js/offline-packs.js',
 'privacy.html','terms.html','about.html','settings.html',
 'supabase/phase20_preproduction_cleanup.sql','.github/workflows/deploy-pages.yml'
]
for f in required:
    if not (R/f).is_file(): E.append('missing '+f)

v=load('version.json'); a=load('data/auth-config.json'); ad=load('data/admin-config.json'); ai=load('data/ai-config.json'); packs=load('data/offline-packs.json')
if tuple(map(int,v.get('version','0.0.0').split('.'))) < (21,19,0): E.append('version older than 21.19.0')
if tuple(map(int,a.get('version','0.0.0').split('.'))) < (21,19,0): E.append('auth config older than 21.19.0')
if tuple(map(int,ad.get('version','0.0.0').split('.'))) < (21,19,0): E.append('admin config older than 21.19.0')
if a.get('enabled') is not True or a.get('provider')!='google': E.append('live Google auth must remain enabled')
if a.get('sync',{}).get('enabled') is not True or a.get('sync',{}).get('table')!='user_app_state': E.append('live per-user sync config missing')
if not str(a.get('publishableKey','')).startswith('sb_publishable_'): E.append('publishable key format invalid')
if re.search(r'(?i)sb_secret_[A-Za-z0-9_-]{8,}', json.dumps(a)) or str(a.get('publishableKey','')).lower().startswith('service_role'): E.append('secret/service-role credential in public auth config')
if a.get('security',{}).get('allowServiceRoleInBrowser') is not False: E.append('service-role browser guard must be false')
if a.get('security',{}).get('sessionStorageOnly') is not True: E.append('cloud sessions must remain sessionStorage-only')

if ad.get('cloudAdmin',{}).get('enabled') not in (False,True): E.append('cloud admin enabled flag invalid')
if ad.get('cloudAdmin',{}).get('enabled') is True and (ad.get('cloudAdmin',{}).get('roleClaim')!='smd_role' or not ad.get('cloudAdmin',{}).get('aggregateOnly')): E.append('enabled cloud admin is not safely role-gated/aggregate-only')
cloud=ai.get('cloud',{}) if isinstance(ai.get('cloud'),dict) else {}
if cloud.get('enabled') is not False: E.append('cloud AI must remain disabled')
if str(cloud.get('endpoint','')).strip(): E.append('cloud AI endpoint must remain blank')

for fn in ['privacy.html','terms.html','about.html','settings.html']:
    low=read(fn).lower()
    if 'google/supabase' in low and 'disabled by default' in low: E.append(fn+' still says Google/Supabase is disabled by default')

cleanup=read('supabase/phase20_preproduction_cleanup.sql')
for marker in [
    'drop trigger if exists on_auth_user_created on auth.users',
    'drop function if exists public.admin_chat_messages',
    'drop function if exists public.admin_dashboard_stats',
    'drop function if exists public.is_owner',
    'drop table if exists public.profiles',
    'drop table if exists public.chats',
    'drop table if exists public.ai_messages',
    'drop table if exists public.user_events',
    'drop table if exists public.ai_usage_daily',
    'drop table if exists public.term_translation_cache',
    'create table if not exists public.user_app_state',
    'grant select, insert, update, delete on table public.user_app_state to authenticated',
    "'synced_accounts', count(*)"
]:
    if marker not in cleanup: E.append('cleanup SQL missing '+marker)
for stale in ['create policy "profile self read"','create policy "chats own read"','create policy "usage own read"']:
    if stale in cleanup: E.append('cleanup SQL recreates dropped legacy schema: '+stale)

legacy=['admin_chat_messages','admin_dashboard_stats','admin_recent_events','admin_user_chats','admin_user_summaries','set_owner_review_consent','touch_last_seen','is_owner(']
for p in list(R.glob('*.html'))+list((R/'assets/js').glob('*.js')):
    if p.name.startswith('admin') and p.suffix=='.html': pass
    s=p.read_text(encoding='utf-8')
    for name in legacy:
        if name in s: E.append(f'legacy RPC runtime reference {name} in {p.relative_to(R)}')

if tuple(map(int,packs.get('version','0.0.0').split('.'))) < (21,19,0): E.append('offline pack version too old')
if not packs.get('cache_prefix','').startswith('smd-v21-phase'): E.append('offline prefix mismatch')
if "const VERSION='smd-v21-phase" not in read('sw.js'): E.append('service worker version mismatch')
if 'const CURRENT_VERSION=' not in read('assets/js/update-manager.js'): E.append('update manager version missing')
if "const prefix='smd-v21-phase" not in read('assets/js/offline-packs.js'): E.append('offline runtime prefix mismatch')

for sec in [packs.get('core',{})]+packs.get('packs',[]):
    urls=sec.get('urls',[]); total=0
    for u in urls:
        q=u.split('?',1)[0].split('#',1)[0]
        if q in ('','./'): continue
        fp=R/(q[2:] if q.startswith('./') else q)
        if not fp.is_file(): E.append('offline URL missing '+u)
        else: total += fp.stat().st_size
    if sec.get('files')!=len(urls): E.append('offline file count mismatch '+str(sec.get('id','core')))
    if sec.get('bytes')!=total: E.append(f"offline bytes mismatch {sec.get('id','core')}: {sec.get('bytes')} != {total}")

wf=read('.github/workflows/deploy-pages.yml')
if 'Deploy Suhail Medical Dictionary' not in wf: E.append('workflow release name mismatch')
if 'python verify_phase20.py' not in wf: E.append('workflow missing phase20 verifier')

# Production build must exclude development SQL/reports and keep live public config.
r=subprocess.run([sys.executable,'tools/build_release.py'],cwd=R,capture_output=True,text=True,timeout=120)
if r.returncode:
    E.append('production build failed: '+(r.stderr or r.stdout).strip())
else:
    S=R/'_site'
    live=json.loads((S/'data/auth-config.json').read_text(encoding='utf-8'))
    if live.get('enabled') is not True or tuple(map(int,live.get('version','0.0.0').split('.'))) < (21,19,0): E.append('production auth config not current/live')
    if (S/'supabase').exists(): E.append('Supabase source/setup files leaked into production artifact')
    if any(S.glob('verify_phase*.py')): E.append('verifiers leaked into production artifact')

for f in ['assets/js/cloud-auth.js','assets/js/cloud-sync.js','assets/js/cloud-readiness.js','assets/js/update-manager.js','assets/js/offline-packs.js','sw.js']:
    q=subprocess.run(['node','--check',f],cwd=R,capture_output=True,text=True)
    if q.returncode: E.append('JS syntax failed '+f+': '+q.stderr.strip())

if E:
    print('PHASE20_FAIL')
    for x in E: print('-',x)
    raise SystemExit(1)
print('PHASE20_PASS pre-production consistency/security cleanup + live cloud sync')
