from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
try: import yaml
except Exception: yaml=None
root=Path(__file__).resolve().parent
errors=[];notes=[]
required=['admin-login.html','admin.html','assets/css/admin.css','assets/js/admin-owner-auth-v2.js','assets/js/admin-login-v2.js','assets/js/admin-loader-v2.js','data/admin-secure-config-v2.json','assets/js/admin-cloud-auth-v2.js','supabase/phase10_admin_metrics.sql','supabase/PHASE10_ADMIN_SETUP.md','PHASE10_REPORT_PASHTO.md','version.json','data/offline-packs.json','sw.js','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file():errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json');cfg=load('data/admin-secure-config-v2.json');authcfg=load('data/auth-config.json');packs=load('data/offline-packs.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv[0]!=21 or vv<(21,9,0):errors.append('version.json must be v21.9.0 or newer for Phase 10')
except Exception:errors.append('version semantic version invalid')
try:
    match=re.match(r'^(\d+)\.(\d+)\.(\d+)',str(cfg.get('version','0.0.0')))
    if not match: raise ValueError('version prefix missing')
    cv=tuple(int(x) for x in match.groups())
    if cv<(21,9,0):errors.append('admin-config version must be 21.9.0 or newer')
except Exception:errors.append('admin-config semantic version prefix invalid')
ca=cfg.get('cloudAdmin',{});privacy=cfg.get('privacy',{})
if ca.get('enabled') is not True:errors.append('verified cloud admin must be enabled in Phase 21')
if ca.get('roleClaim')!='smd_role':errors.append('cloud admin role claim must be smd_role')
if ca.get('allowedRoles')!=['owner']:errors.append('allowed cloud admin roles must be owner-only')
if ca.get('sessionOnly') is not True:errors.append('private admin OAuth must be session-only')
if 'ownerEmail' in ca:errors.append('owner email must not be exposed in public admin configuration')
if 'requireSameAccount' in ca:errors.append('legacy local-account coupling should not be used for private admin authorization')
if ca.get('metricsRpc')!='smd_ai_admin_metrics' or ca.get('aggregateOnly') is not True:errors.append('aggregate-only AI metrics contract missing')
if privacy.get('showRawUserState') is not False or privacy.get('showOtherUserEmails') is not False:errors.append('admin privacy defaults must block raw cross-user state/emails')
if privacy.get('cacheAdminPages') is not False:errors.append('admin pages should not be marked cacheable')
if authcfg.get('security',{}).get('allowServiceRoleInBrowser') is not False:errors.append('browser service-role guard regressed')
# Public workspace must not advertise Admin route.
for fn in ['app.html','anatomy.html','ai.html','offline.html','about.html','settings.html']:
    s=(root/fn).read_text(encoding='utf-8')
    if 'href="admin.html"' in s or 'href="admin-login.html"' in s:errors.append(f'{fn} exposes Admin in public workspace navigation')
loginjs=(root/'assets/js/login.js').read_text(encoding='utf-8')
if "safeReturns=new Set" not in loginjs or "returnTarget=safeReturns.has(requestedReturn)" not in loginjs:errors.append('login does not safely return to admin-login after account setup')
if re.search(r'location\.href\s*=\s*requestedReturn',loginjs):errors.append('unsafe open redirect to raw return parameter')
# Admin pages should be separate and noindex; no password field/static secret gates.
for fn in ['admin-login.html','admin.html']:
    s=(root/fn).read_text(encoding='utf-8')
    if 'noindex,nofollow' not in s:errors.append(f'{fn} missing noindex,nofollow')
    if re.search(r'<input[^>]+type=["\']password',s,re.I):errors.append(f'{fn} must not use insecure static password gating')
if 'Local diagnostics' not in (root/'admin-login.html').read_text(encoding='utf-8'):errors.append('admin login missing local diagnostics mode')
# Client authorization must defer owner authorization to the protected server RPC.
authjs=(root/'assets/js/admin-owner-auth-v2.js').read_text(encoding='utf-8')
if 'user_metadata' in authjs:errors.append('admin client must not authorize with user_metadata')
if "st.source!=='session'" not in authjs:errors.append('admin client must require a fresh session-only OAuth session')
if 'suhail_admin_authorize' not in authjs:errors.append('admin client must use the server-verified authorization RPC')
if 'suhailsaeedy@gmail.com' in authjs.lower():errors.append('admin client must not expose the owner email')
cloudjs=(root/'assets/js/admin-cloud-auth-v2.js').read_text(encoding='utf-8')
for marker in ['getVerifiedUser','app_metadata:user.app_metadata||{}']:
    if marker not in cloudjs:errors.append(f'cloud-auth missing {marker}')
# Admin runtime must be diagnostic/aggregate only.
adminjs=(root/'assets/js/admin-loader-v2.js').read_text(encoding='utf-8')
for marker in ['runDiagnostics','exportDiagnostics','verifiedCloudRole','metricsRpc','Cache Storage' if False else 'cacheAudit']:
    if marker not in adminjs:errors.append(f'admin runtime missing {marker}')
if re.search(r'/rest/v1/(?:user_app_state|auth\.users)',adminjs):errors.append('admin browser must not fetch raw user_app_state/auth.users rows')
if 'state jsonb' in adminjs or 'user_app_state?select=' in adminjs:errors.append('raw state query marker found in admin browser code')
# SQL: security-definer implementation stays private; public wrapper security-invoker; explicit app_metadata role check.
sql=(root/'supabase/phase10_admin_metrics.sql').read_text(encoding='utf-8')
for marker in ['private.smd_admin_metrics()','security definer','public.smd_admin_metrics()','security invoker',"auth.jwt() -> 'app_metadata' ->> 'smd_role'",'revoke all on function public.smd_admin_metrics() from public, anon','grant execute on function public.smd_admin_metrics() to authenticated']:
    if marker.lower() not in sql.lower():errors.append(f'Phase 10 SQL missing security marker: {marker}')
if 'raw_user_meta_data' in sql:errors.append('Phase 10 SQL must not authorize from raw_user_meta_data')
if re.search(r"jsonb_build_object\([^;]*'email'",sql,re.S|re.I):errors.append('admin metrics must not return email addresses')
# Admin routes/assets deliberately not in offline core.
core=set(packs.get('core',{}).get('urls',[]));sw=(root/'sw.js').read_text(encoding='utf-8')
for u in ['./admin.html','./admin-login.html','./assets/js/admin-loader-v2.js','./assets/js/admin-owner-auth-v2.js','./assets/js/admin-login-v2.js','./assets/js/admin-cloud-auth-v2.js','./assets/css/admin.css','./data/admin-secure-config-v2.json','./data/admin-auth-config-v2.json']:
    if u in core:errors.append(f'admin asset should not be in Core Offline Shell: {u}')
    if repr(u) in sw:errors.append(f'admin asset should not be pre-cached by Service Worker: {u}')
# Cache version must be Phase 10+ and offline prefix must match it.
m=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
if not m or int(m.group(1))<10:errors.append('Service Worker must be Phase 10 or newer')
else:
    expected=f"smd-v21-phase{m.group(1)}-pack-"
    if packs.get('cache_prefix')!=expected:errors.append('offline cache prefix does not match active Service Worker')
    off=(root/'assets/js/offline-packs.js').read_text(encoding='utf-8')
    if f"const prefix='{expected}'" not in off:errors.append('offline manager prefix mismatch')
# HTML duplicate IDs + local refs.
class P(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        k={'script':'src','img':'src','link':'href','a':'href'}.get(tag)
        if k and a.get(k):self.refs.append(a[k])
for h in root.glob('*.html'):
    p=P();p.feed(h.read_text(encoding='utf-8'))
    dup=sorted({x for x in p.ids if p.ids.count(x)>1})
    if dup:errors.append(f'{h.name} duplicate ids: {dup}')
    for ref in p.refs:
        if ref.startswith(('http:','https:','mailto:','#','javascript:')):continue
        clean=ref.split('?')[0].split('#')[0]
        if clean and not (h.parent/clean).exists():errors.append(f'{h.name} missing local ref {clean}')
# Parse/syntax structural QA.
for f in root.rglob('*.json'):
    try:json.loads(f.read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'JSON parse failed {f.relative_to(root)}: {e}')
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax skipped')
for f in (root/'assets/css').glob('*.css'):
    s=f.read_text(encoding='utf-8',errors='ignore')
    if s.count('{')!=s.count('}'):errors.append(f'CSS braces unbalanced {f.relative_to(root)}')
# Workflow and docs.
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase10.py' not in wf:errors.append('workflow does not run Phase 10 verifier')
if yaml:
    try:
        y=yaml.safe_load(wf)
        if not isinstance(y,dict) or 'jobs' not in y:errors.append('workflow YAML missing jobs')
    except Exception as e:errors.append(f'workflow YAML invalid: {e}')
if errors:
    print('PHASE 10 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 10 VERIFY PASS')
print('admin route: separate + no public sidebar link')
print('cloud admin: server-verified owner authorization + aggregate-only protected metrics')
print('admin assets excluded from Core Offline Shell')
for n in notes:print('NOTE:',n)
