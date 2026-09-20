from pathlib import Path
import json,re,sys,subprocess
from html.parser import HTMLParser
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parent
errors=[]
def ok(cond,msg):
    if not cond: errors.append(msg)
def text(rel): return (ROOT/rel).read_text(encoding='utf-8',errors='ignore')
# release/version
v=json.loads(text('version.json'))
ok(v.get('version')=='20.19.2','version.json not 20.19.2')
ok(text('DEPLOY_VERSION.txt').strip()=='20.19.2','DEPLOY_VERSION mismatch')
# all main UI pages load aqua last-ish
pages=['index.html','app.html','ai.html','anatomy.html','offline.html','about.html','privacy.html','terms.html','admin.html','admin-login.html']
for f in pages:
    s=text(f); ok('v20-19-aqua-glass.css' in s,f'{f} missing aqua CSS')
    ok('20.19.2' in s,f'{f} missing v20.19 cache stamp')
# Login requirements
idx=text('index.html')
ok('Enter your email address' not in idx,'credential email textbox returned')
ok('Enter your password' not in idx,'credential password textbox returned')
ok('Sign in with current email' in idx and 'Sign in with Other email' in idx,'two login actions missing')
# local offline fallback input is allowed only inside modal.
# Keep this verifier dependency-free so it runs on the stock GitHub Python runner.
class LoginCardParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.depth=0; self.in_card=False; self.found=False; self.bad_inputs=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs); classes=(attrs.get('class') or '').split()
        if not self.in_card and tag=='div' and 'v20-login-card' in classes:
            self.in_card=True; self.found=True; self.depth=1; return
        if self.in_card:
            if tag=='div': self.depth+=1
            if tag=='input' and (attrs.get('type') or '').lower() in {'email','password'}:
                self.bad_inputs.append(attrs.get('type'))
    def handle_endtag(self,tag):
        if self.in_card and tag=='div':
            self.depth-=1
            if self.depth==0: self.in_card=False
card_parser=LoginCardParser(); card_parser.feed(idx)
ok(card_parser.found,'login card missing')
ok(not card_parser.bad_inputs,'main login card contains email/password input')
# Dictionary layout order and shell requirements
app=text('app.html')
hero_pos=app.find('id="dictionary-home"')
search_candidates=[p for p in (app.find('class="med-search-panel'), app.find("class='med-search-panel")) if p >= 0]
search_pos=min(search_candidates) if search_candidates else -1
work_candidates=[p for p in (app.find('class="med-work-area'), app.find("class='med-work-area")) if p >= 0]
work_pos=min(work_candidates) if work_candidates else -1
clinical_pos=app.find('id="clinical-reference"')
ok(all(p >= 0 for p in [hero_pos,search_pos,work_pos,clinical_pos]),'dictionary core sections missing')
if all(p >= 0 for p in [hero_pos,search_pos,work_pos,clinical_pos]):
    ok(hero_pos < search_pos < work_pos < clinical_pos,'dictionary visual order incorrect')
ok('>Dashboard<' not in app,'Dashboard still in public sidebar')
ok('>Admin Panel<' not in app,'Admin Panel still in public sidebar')
# CSS signature
css=text('assets/css/v20-19-aqua-glass.css')
for token in ['backdrop-filter:blur(30px)','--aq-cyan','#termGrid','v20-login-card','med-sidebar','med-topbar','v20-anatomy-page','v20-ai-page']:
    ok(token in css,f'aqua CSS missing signature {token}')
# PWA/cache
sw=text('sw.js')
ok("20260920-v20192" in sw,'service worker build version stale')
ok('v20-19-aqua-glass.css' in sw,'new aqua CSS not precached')
# Workflow must not run pinned old verifiers
wf=text('.github/workflows/deploy-pages.yml')
ok('v20.19.2' in wf,'workflow not v20.19')
# Local HTML refs (dependency-free attribute scan)
attr_re=re.compile(r'\b(src|href)\s*=\s*["\']([^"\']+)["\']',re.I)
for f in pages:
    html=text(f)
    for attr,u in attr_re.findall(html):
        if attr.lower()=='src':
            u=u.split('?',1)[0]
            if not u or u.startswith(('http:','https:','data:','blob:')): continue
        else:
            if not u or u.startswith(('#','http:','https:','mailto:','tel:','javascript:')): continue
            u=u.split('#',1)[0].split('?',1)[0]
            if not u: continue
        if '${' in u or '{{' in u: continue
        p=(ROOT/f).parent/u
        ok(p.resolve().exists(),f'{f} missing {attr.lower()} {u}')
# CSS local url refs
for cssp in (ROOT/'assets/css').glob('*.css'):
    s=cssp.read_text(encoding='utf-8',errors='ignore')
    for m in re.finditer(r'url\([\"\']?([^\)\"\']+)',s):
        u=m.group(1).strip()
        if u.startswith(('data:','http:','https:','#')): continue
        u=u.split('?',1)[0]
        p=(cssp.parent/u).resolve()
        ok(p.exists(),f'{cssp.name} missing url {u}')
# JSON parse
for p in ROOT.rglob('*.json'):
    try: json.loads(p.read_text(encoding='utf-8'))
    except Exception as e: errors.append(f'JSON invalid {p.relative_to(ROOT)}: {e}')
# ensure adult 206 catalogue remains
adult=json.loads(text('data/anatomy/adult-bones.json'))
items=adult.get('items') or adult.get('bones') or []
ok(len(items)>=206,f'adult bone catalogue too small: {len(items)}')
if errors:
    print('FAIL v20.19.2 Aqua Glass verifier')
    for e in errors: print('-',e)
    sys.exit(1)
print('PASS v20.19.2 Aqua Glass verifier')
print('pages',len(pages),'adult bones',len(items))
