from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json,re,sys
R=Path(__file__).resolve().parent
errors=[]
def check(ok,msg):
    if not ok: errors.append(msg)
def read(rel): return (R/rel).read_text(encoding='utf-8',errors='ignore')

v=json.loads(read('version.json'))
check(v.get('version')=='20.19.2','version.json is not 20.19.2')
check(read('DEPLOY_VERSION.txt').strip()=='20.19.2','DEPLOY_VERSION mismatch')
check(json.loads(read('manifest.webmanifest')).get('version')=='20.19.2','manifest version mismatch')

workspace=['app.html','anatomy.html','ai.html','offline.html','about.html','privacy.html','terms.html']
for f in workspace:
    s=read(f)
    check('v20-19-2-responsive-qa.css' in s,f'{f}: missing responsive QA CSS')
    check('v20-19-2-responsive-qa.js' in s,f'{f}: missing responsive QA JS')
    check('20.19.2' in s,f'{f}: stale cache stamp')
    check('name="viewport"' in s or "name='viewport'" in s,f'{f}: missing viewport meta')

app=read('app.html')
for token in ['viewOneButton','viewTwoButton','viewThreeButton','cols-1','cols-2','cols-3']:
    check(token in app or token in read('assets/css/v20-19-2-responsive-qa.css'),f'missing Dictionary density feature: {token}')
check("const source=state.index?.terms||[];return source.filter(x=>ids.has(String(x.id)))" in app,'Bookmarks still depend on active category/filter')
check("const source=state.index?.terms||[];const map=new Map(source.map" in app,'History still depends on active category/filter')
check("p.allow_owner_review=false;localStorage.setItem('smd-local-profile-v1'" in app,'owner-review toggle still mutates privacy acknowledgement')

css=read('assets/css/v20-19-2-responsive-qa.css')
for token in ['position:sticky!important','grid-template-columns:42px minmax(0,1fr) 76px 76px','cols-1','cols-2','cols-3','v20-drawer-open','.dictionary-detail','v20-anatomy-workspace','v20-ai-message-list']:
    check(token in css,f'responsive CSS missing {token}')
js=read('assets/js/v20-19-2-responsive-qa.js')
for token in ['normalizeMenu','selectControl','searchControl','normalizeSidebar','normalizeReference','normalizeViewButtons']:
    check(token in js,f'responsive JS missing {token}')
check('clinical-reference' in js,'Clinical Reference sidebar cleanup missing')

# Active JS should not use stale runtime cache stamps.
for p in (R/'assets/js').glob('*.js'):
    s=p.read_text(encoding='utf-8',errors='ignore')
    if p.name!='config.example.js':
        check('?v=20.18.2' not in s and '?v=20.19.1' not in s,f'{p.name}: stale import cache version')

sw=read('sw.js')
check('v20-19-2-responsive-qa.css' in sw,'responsive CSS not precached')
check('v20-19-2-responsive-qa.js' in sw,'responsive JS not precached')
check("BUILD_VERSION='20260920-v20192'" in sw,'service worker build id mismatch')

# Local static references in HTML must resolve. Ignore hashes, templates, mailto/tel/data/javascript.
attr_re=re.compile(r'''(?:src|href)=["']([^"']+)["']''',re.I)
for f in ['index.html','app.html','anatomy.html','ai.html','offline.html','about.html','privacy.html','terms.html','admin-login.html','admin.html']:
    for u in attr_re.findall(read(f)):
        if not u or '${' in u or u.startswith(('#','data:','javascript:','mailto:','tel:','http://','https://')): continue
        u=urlsplit(u).path
        if not u: continue
        target=(R/f).parent/u
        check(target.resolve().exists(),f'{f}: missing local reference {u}')

# Duplicate ids catch a common responsive-shell failure.
class IdParser(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
for f in ['index.html','app.html','anatomy.html','ai.html','offline.html','about.html','privacy.html','terms.html']:
    p=IdParser();p.feed(read(f));dups=sorted({x for x in p.ids if p.ids.count(x)>1})
    check(not dups,f'{f}: duplicate ids {dups[:5]}')

if errors:
    print('v20.19.2 responsive QA: FAIL')
    for e in errors: print('-',e)
    sys.exit(1)
print('v20.19.2 responsive QA: PASS')
