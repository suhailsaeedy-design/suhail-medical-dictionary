from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
try: import yaml
except Exception: yaml=None
root=Path(__file__).resolve().parent
errors=[];notes=[]
required=['about.html','settings.html','assets/css/personal-workspace.css','assets/js/workspace-pages.js','verify_phase6.py','version.json','data/offline-packs.json','sw.js','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json');packs=load('data/offline-packs.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv[0]!=21 or vv<(21,5,0):errors.append('version.json must be v21.5.0 or newer for Phase 6')
except Exception:errors.append('version.json semantic version invalid')
# New pages are real shared-shell destinations, not duplicated page modals.
for fn in ['app.html','anatomy.html','ai.html','offline.html','about.html','settings.html']:
    s=(root/fn).read_text(encoding='utf-8')
    for href in ['href="about.html"','href="settings.html"']:
        if href not in s:errors.append(f'{fn} missing shared-shell {href}')
    if fn in ['app.html','anatomy.html','ai.html','offline.html'] and ('id="settingsModal"' in s or 'id="aboutModal"' in s):errors.append(f'{fn} still contains duplicate About/Settings modal')
# Selected workspace runtime
app=(root/'app.html').read_text(encoding='utf-8');djs=(root/'assets/js/dictionary.js').read_text(encoding='utf-8')
for marker in ['data-mode="selected"','id="detailSelected"','id="selectedActions"','id="studySelected"','id="clearSelectedTerms"']:
    if marker not in app:errors.append(f'app.html missing {marker}')
for marker in ["smd21_selected","state.mode==='selected'",'data-select','getSelected','ai.html?terms=']:
    if marker not in djs:errors.append(f'Selected runtime missing {marker}')
# AI handoff supports multiple selected terms.
aijs=(root/'assets/js/ai-study.js').read_text(encoding='utf-8')
if "params.get('terms')" not in aijs:errors.append('AI Study multi-term handoff missing')
# Settings controls are functional local preferences/data management.
settings=(root/'settings.html').read_text(encoding='utf-8');wjs=(root/'assets/js/workspace-pages.js').read_text(encoding='utf-8');core=(root/'assets/js/core.js').read_text(encoding='utf-8')
for marker in ['data-font-scale','data-motion-select','columnsSetting','selectedCount','bookmarkCount','historyCount','chatCount','clearAllStudyData','resetPreferences']:
    if marker not in settings:errors.append(f'settings.html missing {marker}')
for marker in ['smd21_selected','smd21_bookmarks','smd21_history','smd21_ai_chats_','clearAllStudyData','resetPreferences','smd21_pending_search']:
    if marker not in wjs:errors.append(f'workspace settings runtime missing {marker}')
for marker in ['setMotion','setFontScale','data-motion','smd21_font_scale']:
    if marker not in core:errors.append(f'core preference runtime missing {marker}')
# About truthfulness/creator/scope markers.
about=(root/'about.html').read_text(encoding='utf-8')
for marker in ['Suhail Saeedi','educational medical reference','diagnosis','schematic','versionChip','Privacy','Terms']:
    if marker not in about:errors.append(f'about.html missing {marker}')
# Offline core includes the new pages/runtime.
core_urls=packs.get('core',{}).get('urls',[])
for u in ['./about.html','./settings.html','./assets/css/personal-workspace.css','./assets/js/workspace-pages.js']:
    if u not in core_urls:errors.append(f'Phase 6 core offline shell missing {u}')
sw=(root/'sw.js').read_text(encoding='utf-8')
mver=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
if not mver or int(mver.group(1))<6:errors.append('service worker must be Phase 6 or newer')
for u in core_urls:
    if repr(u) not in sw:errors.append(f'service worker core missing {u}')
# Duplicate IDs and local references.
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
# JSON parse and JS syntax.
for f in root.rglob('*.json'):
    try:json.loads(f.read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'JSON parse failed {f.relative_to(root)}: {e}')
try:
    for f in list((root/'assets/js').glob('*.js'))+[root/'sw.js']:
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:errors.append(f'JS syntax failed {f.relative_to(root)}: {r.stderr.strip()}')
except FileNotFoundError:notes.append('node unavailable; JS syntax skipped')
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase6.py' not in wf:errors.append('workflow does not run Phase 6 verifier')
if yaml:
    try:
        y=yaml.safe_load(wf)
        if not isinstance(y,dict) or 'jobs' not in y:errors.append('workflow YAML missing jobs')
    except Exception as e:errors.append(f'workflow YAML invalid: {e}')
# Legacy presentation runtime ban.
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['about.html','settings.html','assets/css/personal-workspace.css','assets/js/workspace-pages.js'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-shell','v20-settings']:
    if banned in joined:errors.append(f'legacy runtime reference {banned}')
if errors:
    print('PHASE 6 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 6 VERIFY PASS')
print('personal workspace: Selected Terms + About + Settings')
print('core offline files:',len(core_urls))
for n in notes:print('NOTE:',n)
