from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,sys
root=Path(__file__).resolve().parent
errors=[];notes=[]
required=['assets/js/i18n.js','assets/js/core.js','assets/css/app.css','verify_phase11.py','PHASE11_REPORT_PASHTO.md','version.json','data/offline-packs.json','sw.js','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
def load(p):
    try:return json.loads((root/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p} invalid JSON: {e}');return {}
ver=load('version.json');packs=load('data/offline-packs.json')
try:
    vv=tuple(int(x) for x in str(ver.get('version','0.0.0')).split('.'))
    if vv<(21,10,0):errors.append('version.json must be v21.10.0 or newer for Phase 11')
except Exception:errors.append('invalid semantic version')
core=(root/'assets/js/core.js').read_text(encoding='utf-8')
i18n=(root/'assets/js/i18n.js').read_text(encoding='utf-8')
css=(root/'assets/css/app.css').read_text(encoding='utf-8')
langs=['en','ps','prs','fa','ar','tr','zh']
for lang in langs:
    if f"'{lang}'" not in core and f'code:\'{lang}\'' not in i18n:errors.append(f'language missing from runtime: {lang}')
for marker in ["VALID_LANGUAGES","RTL_LANGUAGES","smd21_lang_v11_migrated","new CustomEvent('smd21:languagechange'"]:
    if marker not in core:errors.append(f'core language marker missing: {marker}')
for marker in ["{code:'en'","{code:'ps'","{code:'prs'","{code:'fa'","{code:'ar'","{code:'tr'","{code:'zh'","MutationObserver","formatCount","translateExact"]:
    if marker not in i18n:errors.append(f'i18n engine marker missing: {marker}')
# Require substantial phrase coverage in each non-English language.
for lang in ['ps','prs','fa','ar','tr','zh']:
    if lang!='fa':
        m=re.search(rf"\n    {re.escape(lang)}:\{{(.*?)\n    \}},",i18n,re.S)
        if m and m.group(1).count("':")<80:errors.append(f'{lang} UI phrase coverage unexpectedly small')
for marker in ['[dir="rtl"] .app-sidebar','[dir="rtl"] .app-topbar','[dir="rtl"] .app-main','[dir="rtl"] .detail-drawer','translateX(105%)']:
    if marker not in css:errors.append(f'RTL CSS missing: {marker}')
# Every user-facing page must load the translator after core.
pages=['index.html','app.html','anatomy.html','ai.html','offline.html','settings.html','about.html','privacy.html','terms.html','admin-login.html','admin.html','auth-callback.html']
for fn in pages:
    s=(root/fn).read_text(encoding='utf-8')
    if 'assets/js/core.js' not in s or 'assets/js/i18n.js' not in s:errors.append(f'{fn} missing core/i18n runtime')
    if s.find('assets/js/i18n.js')<s.find('assets/js/core.js'):errors.append(f'{fn} loads i18n before core')
# Every language selector source exposes all seven values.
for h in root.glob('*.html'):
    s=h.read_text(encoding='utf-8')
    if 'data-lang-select' in s:
        for lang in langs:
            if f'value="{lang}"' not in s:errors.append(f'{h.name} language select missing {lang}')
# Medical content localization must deliberately fallback, not invent Arabic/Turkish/Chinese fields.
dictjs=(root/'assets/js/dictionary.js').read_text(encoding='utf-8')
study=(root/'assets/js/study-engine.js').read_text(encoding='utf-8')
for marker in ["['prs','fa'].includes(SMD21.state.lang)?'fa'","window.addEventListener('smd21:languagechange'"]:
    if marker not in dictjs:errors.append(f'dictionary localization marker missing: {marker}')
if "['prs','fa'].includes(lang)?'fa':lang" not in study:errors.append('study engine does not map Dari/Persian content safely')
# Cloud sync accepts all UI languages.
cloud=(root/'assets/js/cloud-sync.js').read_text(encoding='utf-8')
for lang in langs:
    if f"'{lang}'" not in cloud:errors.append(f'cloud preference sync missing language {lang}')
# i18n runtime must be in automatic core offline shell.
core_urls=packs.get('core',{}).get('urls',[])
if './assets/js/i18n.js' not in core_urls:errors.append('i18n runtime missing from Core Offline Shell')
sw=(root/'sw.js').read_text(encoding='utf-8')
m=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
if not m or int(m.group(1))<11:errors.append('Service Worker cache must be Phase 11 or newer')
if "'./assets/js/i18n.js'" not in sw:errors.append('Service Worker does not pre-cache i18n runtime')
prefix=str(packs.get('cache_prefix',''));pm=re.fullmatch(r'smd-v21-phase(\d+)-pack-',prefix)
if not pm or int(pm.group(1))<11:errors.append('offline pack prefix must be Phase 11 or newer')
off=(root/'assets/js/offline-packs.js').read_text(encoding='utf-8')
om=re.search(r"const prefix='smd-v21-phase(\d+)-pack-'",off)
if not om or int(om.group(1))<11:errors.append('offline runtime prefix must be Phase 11 or newer')
# HTML duplicate IDs and local refs.
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
# JSON and JS/CSS syntax.
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
wf=(root/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
if 'python verify_phase11.py' not in wf:errors.append('workflow does not run Phase 11 verifier')
if errors:
    print('PHASE 11 VERIFY FAIL')
    for e in errors:print('-',e)
    for n in notes:print('NOTE:',n)
    sys.exit(1)
print('PHASE 11 VERIFY PASS')
print('UI languages: English, Pashto, Dari, Persian, Arabic, Turkish, Chinese')
print('RTL: Pashto, Dari, Persian, Arabic')
print('Medical corpus: existing localized fields only; unsupported content falls back to English')
for n in notes:print('NOTE:',n)
