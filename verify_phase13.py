from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys,tempfile,textwrap
root=Path(__file__).resolve().parent
errors=[];notes=[]
required=['assets/js/backup-manager.js','assets/js/update-manager.js','settings.html','version.json','data/offline-packs.json','sw.js','verify_phase13.py','PHASE13_REPORT_PASHTO.md','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json');packs=load('data/offline-packs.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv<(21,12,0) or vv[0]!=21:errors.append('version.json must be v21.12.0 or newer for Phase 13')
except Exception:errors.append('version.json semantic version invalid')
settings=(root/'settings.html').read_text(encoding='utf-8')
for marker in ['Backup & restore','exportAccountBackup','restoreBackupFile','restoreMode','allowCrossAccountRestore','Restore backup','Release & PWA updates','checkReleaseUpdate','applyReleaseUpdate','currentReleaseVersion','latestReleaseVersion','assets/js/backup-manager.js','assets/js/update-manager.js']:
    if marker not in settings:errors.append(f'Settings Phase 13 marker missing: {marker}')
backup=(root/'assets/js/backup-manager.js').read_text(encoding='utf-8')
for marker in ["const KIND='smd21-account-backup'","const MAX_FILE=5*1024*1024","SMD21Auth.scopedKey('selected')","SMD21Auth.scopedKey('bookmarks')","SMD21Auth.scopedKey('history')","smd21_ai_chats_","schema_version:SCHEMA","source_account:accountEmail()","exclusions:","mode==='replace'","mergeChats","allowCrossAccountRestore"]:
    if marker not in backup:errors.append(f'backup runtime marker missing: {marker}')
for forbidden in ['sessionStorage','CLOUD_SESSION','smd21_consent','service_role','supabase_secret']:
    if forbidden in backup:errors.append(f'backup runtime must not export/use sensitive state marker: {forbidden}')
update=(root/'assets/js/update-manager.js').read_text(encoding='utf-8')
for marker in ["version.json?update_check=","cache:'no-store'","reg.update()","SKIP_WAITING","controllerchange"]:
    if marker not in update:errors.append(f'update runtime marker missing: {marker}')
mv=re.search(r"const CURRENT_VERSION='([^']+)'",update)
if not mv or mv.group(1)!=str(ver.get('version')):errors.append('update runtime version must match version.json')
sw=(root/'sw.js').read_text(encoding='utf-8')
for marker in ["./version.json","./assets/js/backup-manager.js","./assets/js/update-manager.js","event.request.mode==='navigate'","networkFirstNavigation","cache:'no-store'","SKIP_WAITING"]:
    if marker not in sw:errors.append(f'Service Worker Phase 13+ marker missing: {marker}')
sm=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
if not sm or int(sm.group(1))<13:errors.append('Service Worker cache must be Phase 13 or newer')
off=(root/'assets/js/offline-packs.js').read_text(encoding='utf-8')
pm=re.search(r"const prefix='([^']+)'",off)
if not pm:errors.append('offline runtime prefix missing')
elif pm.group(1)!=packs.get('cache_prefix'):errors.append('offline runtime/manifest prefix mismatch')
if sm and packs.get('cache_prefix')!=f"smd-v21-phase{sm.group(1)}-pack-":errors.append('offline manifest prefix not coherent with Service Worker release')
core=packs.get('core',{})
for u in ['./version.json','./assets/js/backup-manager.js','./assets/js/update-manager.js','./settings.html']:
    if u not in core.get('urls',[]):errors.append(f'Core Offline Shell missing {u}')
def local_path(url):
    clean=url.split('?',1)[0].split('#',1)[0]
    if clean in ('./',''):return None
    if clean.startswith('./'):clean=clean[2:]
    return root/clean
for sec in [core]+packs.get('packs',[]):
    urls=sec.get('urls',[])
    for u in urls:
        p=local_path(u)
        if p is not None and not p.exists():errors.append(f'offline URL missing local file {u}')
    actual=sum(local_path(u).stat().st_size for u in urls if local_path(u) is not None and local_path(u).is_file())
    if sec.get('bytes')!=actual:errors.append(f"offline byte total mismatch for {sec.get('id','core')}: {sec.get('bytes')} != {actual}")
if core.get('files')!=len(core.get('urls',[])):errors.append('core files count mismatch')
# Runtime backup test in Node with browser stubs
node_test=r'''
const fs=require('fs'),vm=require('vm');
const store=new Map();
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.document={addEventListener:()=>{},querySelector:()=>null,body:{append:()=>{}},createElement:()=>({click(){},remove(){}}),dispatchEvent:()=>{}};
global.CustomEvent=function(){};global.Blob=function(){};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.setTimeout=()=>{};
global.window=global;
let account={email:'alpha@example.com'};
global.SMD21Auth={getAccount:()=>account,scopedKey:n=>`smd21_${n}_${encodeURIComponent(account.email)}`,touchProfile:()=>{}};
global.SMD21={validLangs:['en','ps','prs','fa','ar','tr','zh'],setTheme:v=>store.set('smd21_theme',v),setLang:v=>store.set('smd21_lang',v),setMotion:v=>store.set('smd21_motion',v),setFontScale:v=>store.set('smd21_font_scale',String(v))};
global.fetch=async()=>({ok:true,json:async()=>({version:'21.12.0'})});
vm.runInThisContext(fs.readFileSync('assets/js/backup-manager.js','utf8'));
const k=n=>SMD21Auth.scopedKey(n),chatKey=()=>`smd21_ai_chats_${encodeURIComponent(account.email)}`;
store.set(k('selected'),JSON.stringify(['D1','D2']));store.set(k('bookmarks'),JSON.stringify(['D2']));store.set(k('history'),JSON.stringify(['D3']));
store.set(chatKey(),JSON.stringify([{id:'c1',title:'Test',createdAt:'2026',updatedAt:'2026',contextIds:['D1'],messages:[{id:'m1',role:'user',kind:'text',text:'hello',createdAt:'2026'},{id:'m2',role:'assistant',kind:'study',payload:{kind:'summary',termIds:['D1']},createdAt:'2026'}]}]));
(async()=>{const b=await SMD21Backup.buildBackup();if(b.source_account!=='alpha@example.com'||b.data.chats[0].messages[0].text!=='hello'||b.data.chats[0].messages[1].payload.kind!=='summary')throw Error('backup build lost account/chat data');
if('token' in b.data||'session' in b.data||'consent' in b.data||'cloud_session' in b.data)throw Error('unexpected sensitive field material');
account={email:'beta@example.com'};SMD21Backup.restoreBackup(b,'replace');if(JSON.parse(store.get(k('selected')))[0]!=='D1')throw Error('replace restore did not target active account');
store.set(k('selected'),JSON.stringify(['D9']));SMD21Backup.restoreBackup(b,'merge');const s=JSON.parse(store.get(k('selected')));if(!s.includes('D9')||!s.includes('D1'))throw Error('merge restore failed');console.log('BACKUP_RUNTIME_PASS');})().catch(e=>{console.error(e);process.exit(1)});
'''
try:
    r=subprocess.run(['node','-e',node_test],cwd=root,capture_output=True,text=True,timeout=20)
    if r.returncode or 'BACKUP_RUNTIME_PASS' not in r.stdout:errors.append('Node backup runtime test failed: '+(r.stderr or r.stdout).strip())
except Exception as e:errors.append(f'Node backup runtime test failed to run: {e}')
# Syntax/JSON/CSS
for f in root.rglob('*.json'):
    try:json.loads(f.read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'JSON parse failed {f.relative_to(root)}: {e}')
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax skipped')
for f in (root/'assets/css').glob('*.css'):
    t=f.read_text(encoding='utf-8',errors='ignore')
    if t.count('{')!=t.count('}'):errors.append(f'CSS braces unbalanced {f.relative_to(root)}')
# HTML duplicate ids/local refs
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
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase13.py' not in wf:errors.append('workflow does not run Phase 13 verifier')
if errors:
    print('PHASE 13 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 13 VERIFY PASS')
print('Core Offline Shell:',core.get('files'),'files /',core.get('bytes'),'bytes')
print('Backup runtime: PASS (build + replace + merge + chat payload preservation)')
for n in notes:print('NOTE:',n)
