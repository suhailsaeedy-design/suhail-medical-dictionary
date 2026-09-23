from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
try: import yaml
except Exception: yaml=None
root=Path(__file__).resolve().parent
errors=[];notes=[]
required=['auth-callback.html','data/auth-config.json','assets/js/cloud-auth.js','assets/js/cloud-sync.js','supabase/phase7_user_app_state.sql','supabase/README.md','PHASE7_REPORT_PASHTO.md','verify_phase7.py','version.json','data/offline-packs.json','sw.js','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file():errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json');cfg=load('data/auth-config.json');packs=load('data/offline-packs.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv[0]!=21 or vv<(21,6,0):errors.append('version.json must be v21.6.0 or newer for Phase 7')
except Exception:errors.append('version.json semantic version invalid')
# Cloud config is optional in Phase 7; later releases may activate it with browser-safe public credentials.
if cfg.get('enabled') is True:
    if not str(cfg.get('supabaseUrl','')).startswith('https://'):errors.append('activated Supabase URL must use HTTPS')
    if not str(cfg.get('publishableKey','')).startswith('sb_publishable_'):errors.append('activated frontend must use a modern publishable key')
    if cfg.get('sync',{}).get('enabled') is not True:errors.append('activated cloud auth should enable configured sync')
else:
    if str(cfg.get('supabaseUrl','')).strip():errors.append('disabled supabaseUrl must be blank')
    if str(cfg.get('publishableKey','')).strip():errors.append('disabled publishableKey must be blank')
if cfg.get('security',{}).get('allowServiceRoleInBrowser') is not False:errors.append('service-role browser usage must be forbidden')
if cfg.get('security',{}).get('sessionStorageOnly') is not False:errors.append('Phase 21 verified cloud session should persist until explicit sign out')
# Runtime secret scan (documentation can discuss forbidden secret names, runtime cannot contain actual secret values).
for f in list((root/'assets/js').glob('*.js'))+[root/'data/auth-config.json']:
    s=f.read_text(encoding='utf-8',errors='ignore')
    for pat in [r'sb_secret_[A-Za-z0-9_-]{8,}',r'postgres(?:ql)?://[^\s"\']+',r'AIza[0-9A-Za-z_-]{20,}']:
        if re.search(pat,s):errors.append(f'possible secret in runtime file {f.relative_to(root)}')
# Account-scoped profile storage and legacy migration.
auth=(root/'assets/js/auth.js').read_text(encoding='utf-8');djs=(root/'assets/js/dictionary.js').read_text(encoding='utf-8');wjs=(root/'assets/js/workspace-pages.js').read_text(encoding='utf-8')
for marker in ['scopedKey','accountKey','migrateLegacyProfileData','smd21_selected','smd21_bookmarks','smd21_history','touchProfile']:
    if marker not in auth:errors.append(f'auth account-scoping missing {marker}')
for marker in ["SMD21Auth.scopedKey('selected')","SMD21Auth.scopedKey('bookmarks')","SMD21Auth.scopedKey('history')"]:
    if marker not in djs:errors.append(f'Dictionary not account-scoped: {marker}')
for marker in ["SMD21Auth.scopedKey('selected')","SMD21Auth.scopedKey('bookmarks')","SMD21Auth.scopedKey('history')"]:
    if marker not in wjs:errors.append(f'Settings not account-scoped: {marker}')
# OAuth callback and user verification contract.
ca=(root/'assets/js/cloud-auth.js').read_text(encoding='utf-8');cb=(root/'auth-callback.html').read_text(encoding='utf-8');login=(root/'assets/js/login.js').read_text(encoding='utf-8');index=(root/'index.html').read_text(encoding='utf-8')
for marker in ['/auth/v1/authorize','prompt','select_account','redirect_to','/auth/v1/user','access_token','refresh_token','localStorage','sessionStorage','signOutRemote','clearSession']:
    if marker not in ca:errors.append(f'cloud auth runtime missing {marker}')
if 'SMD21CloudAuth.handleCallback()' not in cb:errors.append('auth callback handler missing')
if 'assets/js/cloud-auth.js' not in index or 'SMD21CloudAuth.startGoogleSignIn' not in login:errors.append('Login not wired to optional cloud auth')
if 'Enter your password' in index:errors.append('password field returned to login')
# Cloud sync runtime must use authenticated user identity and explicit table config.
cs=(root/'assets/js/cloud-sync.js').read_text(encoding='utf-8')
for marker in ['user_id','Authorization:`Bearer','SMD21CloudAuth.status()','resolution=merge-duplicates','applyRemote','mergeChats','preferences']:
    if marker not in cs:errors.append(f'cloud sync runtime missing {marker}')
settings=(root/'settings.html').read_text(encoding='utf-8')
for marker in ['cloudBadge','connectGoogle','pullCloud','pushCloud','disconnectCloud','assets/js/cloud-sync.js']:
    if marker not in settings:errors.append(f'settings cloud controls missing {marker}')
for marker in ['initCloud','SMD21CloudSync.pull()','SMD21CloudSync.push()','Not configured']:
    if marker not in wjs:errors.append(f'settings cloud runtime missing {marker}')
# Supabase SQL security invariants.
sql=(root/'supabase/phase7_user_app_state.sql').read_text(encoding='utf-8').lower()
for marker in ['enable row level security','to authenticated','auth.uid()','with check','revoke all on table public.user_app_state from anon']:
    if marker not in sql:errors.append(f'RLS SQL missing {marker}')
if 'security definer' in sql:errors.append('sync schema must not use SECURITY DEFINER')
if sql.count('auth.uid()')<4:errors.append('ownership predicate missing from one or more RLS operations')
# Offline core includes auth runtime required by index/settings.
core_urls=packs.get('core',{}).get('urls',[])
for u in ['./auth-callback.html','./data/auth-config.json','./assets/js/cloud-auth.js','./assets/js/cloud-sync.js']:
    if u not in core_urls:errors.append(f'Phase 7 core offline shell missing {u}')
sw=(root/'sw.js').read_text(encoding='utf-8')
m=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
if not m or int(m.group(1))<7:errors.append('service worker must be Phase 7 or newer')
for u in core_urls:
    if repr(u) not in sw:errors.append(f'service worker core missing {u}')
# HTML duplicate IDs and local refs.
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
# Parse and syntax.
for f in root.rglob('*.json'):
    try:json.loads(f.read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'JSON parse failed {f.relative_to(root)}: {e}')
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax skipped')
# Runtime smoke for profile isolation/migration and sync merge functions.
node_test=r'''
const fs=require('fs'),vm=require('vm');global.window=global;
class S{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
global.localStorage=new S();global.sessionStorage=new S();global.location={replace(){},pathname:'/app.html'};
localStorage.setItem('smd21_selected',JSON.stringify(['legacy-a']));
vm.runInThisContext(fs.readFileSync('assets/js/auth.js','utf8'));
SMD21Auth.saveConsent();SMD21Auth.saveAccount('One@Example.com','local');
const k1=SMD21Auth.scopedKey('selected');if(JSON.parse(localStorage.getItem(k1))[0]!=='legacy-a')throw Error('legacy migration failed');
SMD21Auth.saveAccount('two@example.com','local');const k2=SMD21Auth.scopedKey('selected');if(k1===k2||localStorage.getItem(k2)!==null)throw Error('profile isolation failed');
SMD21Auth.saveAccount('one@example.com','local');
global.SMD21={setTheme(v){localStorage.setItem('smd21_theme',v)},setLang(v){localStorage.setItem('smd21_lang',v)},setMotion(v){localStorage.setItem('smd21_motion',v)},setFontScale(v){localStorage.setItem('smd21_font_scale',String(v))}};
global.SMD21CloudAuth={status:async()=>({configured:false})};
vm.runInThisContext(fs.readFileSync('assets/js/cloud-sync.js','utf8'));
localStorage.setItem(SMD21Auth.scopedKey('selected'),JSON.stringify(['local-a']));
SMD21CloudSync.applyRemote({selected:['cloud-b'],bookmarks:['cloud-c'],history:['cloud-d'],chats:[],preferences:{theme:'light',columns:2}});
const merged=JSON.parse(localStorage.getItem(SMD21Auth.scopedKey('selected')));if(!merged.includes('local-a')||!merged.includes('cloud-b'))throw Error('cloud merge failed');
if(localStorage.getItem('smd21_cols')!=='2')throw Error('preference merge failed');
console.log('PHASE7_NODE_RUNTIME_OK');
'''
try:
    r=subprocess.run(['node','-e',node_test],cwd=root,capture_output=True,text=True)
    if r.returncode or 'PHASE7_NODE_RUNTIME_OK' not in r.stdout:errors.append('Phase 7 Node runtime smoke failed: '+(r.stderr.strip() or r.stdout.strip()))
except FileNotFoundError:notes.append('node unavailable; Phase 7 runtime smoke skipped')
# Workflow
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase7.py' not in wf:errors.append('workflow does not run Phase 7 verifier')
if yaml:
    try:
        y=yaml.safe_load(wf)
        if not isinstance(y,dict) or 'jobs' not in y:errors.append('workflow YAML missing jobs')
    except Exception as e:errors.append(f'workflow YAML invalid: {e}')
# Legacy runtime ban.
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['auth-callback.html','settings.html','assets/js/auth.js','assets/js/cloud-auth.js','assets/js/cloud-sync.js'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-shell','v20-auth']:
    if banned in joined:errors.append(f'legacy runtime reference {banned}')
if errors:
    print('PHASE 7 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 7 VERIFY PASS')
print('account-scoped local profiles + optional Google/Supabase sync architecture')
print('core offline files:',len(core_urls))
for n in notes:print('NOTE:',n)
