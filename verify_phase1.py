from pathlib import Path
from html.parser import HTMLParser
import json, re, sys
root=Path(__file__).resolve().parent
errors=[]
required=['index.html','app.html','privacy.html','terms.html','manifest.webmanifest','sw.js','version.json','data/index.json','data/clinical-reference.json','assets/css/app.css','assets/js/core.js','assets/js/auth.js','assets/js/login.js','assets/js/dictionary.js','assets/js/pwa.js','.github/workflows/deploy-pages.yml']
for f in required:
    if not (root/f).is_file(): errors.append(f'missing {f}')
# data checks
try:
    idx=json.loads((root/'data/index.json').read_text(encoding='utf-8'))
    if len(idx.get('terms',[]))<1000: errors.append('dictionary term count below 1000')
    if len(idx.get('categories',[]))<10: errors.append('category count below 10')
except Exception as e: errors.append(f'index.json invalid: {e}')
try:
    v=json.loads((root/'version.json').read_text())
    if not str(v.get('version','')).startswith('21.'): errors.append('version mismatch')
except Exception as e: errors.append(f'version invalid: {e}')
# HTML local refs
class P(HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]; self.ids=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag in ('script','img','link','a'):
            k={'script':'src','img':'src','link':'href','a':'href'}[tag]
            if a.get(k): self.refs.append(a[k])
for html in root.glob('*.html'):
    p=P(); p.feed(html.read_text(encoding='utf-8'))
    dups={x for x in p.ids if p.ids.count(x)>1}
    if dups: errors.append(f'{html.name} duplicate ids: {sorted(dups)}')
    for ref in p.refs:
        if ref.startswith(('http:','https:','mailto:','#','javascript:')): continue
        ref=ref.split('?')[0].split('#')[0]
        if not ref: continue
        path=(html.parent/ref).resolve()
        try: path.relative_to(root.resolve())
        except: continue
        if not path.exists(): errors.append(f'{html.name} missing ref {ref}')
# Clean-rebuild invariants
joined='\n'.join((root/f).read_text(encoding='utf-8',errors='ignore') for f in ['index.html','app.html','assets/css/app.css','assets/js/dictionary.js'])
for banned in ['v16.css','v17.css','v18.css','v19.css','v20-shell','v20-dictionary']:
    if banned in joined: errors.append(f'legacy runtime reference: {banned}')
if 'type="email"' in (root/'index.html').read_text() and 'otherEmail' not in (root/'index.html').read_text(): errors.append('unexpected login email field')
if 'Enter your password' in (root/'index.html').read_text(): errors.append('password field returned')
if 'data-cols="1"' not in (root/'app.html').read_text() or 'data-cols="2"' not in (root/'app.html').read_text() or 'data-cols="3"' not in (root/'app.html').read_text(): errors.append('missing 1/2/3 card view controls')
if 'Clinical Reference' not in (root/'app.html').read_text() or 'clinicalToggle' not in (root/'app.html').read_text(): errors.append('clinical reference collapse missing')
if errors:
    print('PHASE 1 VERIFY FAIL')
    for e in errors: print('-',e)
    sys.exit(1)
print('PHASE 1 VERIFY PASS')
print('terms:',len(idx['terms']),'categories:',len(idx['categories']))
