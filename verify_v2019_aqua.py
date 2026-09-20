from pathlib import Path
import json,re,sys,subprocess
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parent
errors=[]
def ok(cond,msg):
    if not cond: errors.append(msg)
def text(rel): return (ROOT/rel).read_text(encoding='utf-8',errors='ignore')
# release/version
v=json.loads(text('version.json'))
ok(v.get('version')=='20.19.0','version.json not 20.19.0')
ok(text('DEPLOY_VERSION.txt').strip()=='20.19.0','DEPLOY_VERSION mismatch')
# all main UI pages load aqua last-ish
pages=['index.html','app.html','ai.html','anatomy.html','offline.html','about.html','privacy.html','terms.html','admin.html','admin-login.html']
for f in pages:
    s=text(f); ok('v20-19-aqua-glass.css' in s,f'{f} missing aqua CSS')
    ok('20.19.0' in s,f'{f} missing v20.19 cache stamp')
# Login requirements
idx=text('index.html')
ok('Enter your email address' not in idx,'credential email textbox returned')
ok('Enter your password' not in idx,'credential password textbox returned')
ok('Sign in with current email' in idx and 'Sign in with Other email' in idx,'two login actions missing')
# local offline fallback input is allowed only inside modal
soup=BeautifulSoup(idx,'html.parser')
card=soup.select_one('.v20-login-card')
ok(card is not None,'login card missing')
if card:
    ok(not card.select('input[type="email"],input[type="password"]'),'main login card contains email/password input')
# Dictionary layout order and shell requirements
app=text('app.html'); soup=BeautifulSoup(app,'html.parser')
hero=soup.select_one('#dictionary-home'); search=soup.select_one('.med-search-panel'); work=soup.select_one('.med-work-area'); clinical=soup.select_one('#clinical-reference')
ok(all([hero,search,work,clinical]),'dictionary core sections missing')
if all([hero,search,work,clinical]):
    # document order
    tags=list(soup.find_all(True)); pos={id(x):i for i,x in enumerate(tags)}
    ok(pos[id(hero)]<pos[id(search)]<pos[id(work)]<pos[id(clinical)],'dictionary visual order incorrect')
ok('>Dashboard<' not in app,'Dashboard still in public sidebar')
ok('>Admin Panel<' not in app,'Admin Panel still in public sidebar')
# CSS signature
css=text('assets/css/v20-19-aqua-glass.css')
for token in ['backdrop-filter:blur(30px)','--aq-cyan','#termGrid','v20-login-card','med-sidebar','med-topbar','v20-anatomy-page','v20-ai-page']:
    ok(token in css,f'aqua CSS missing signature {token}')
# PWA/cache
sw=text('sw.js')
ok("20260920-v20190" in sw,'service worker build version stale')
ok('v20-19-aqua-glass.css' in sw,'new aqua CSS not precached')
# Workflow must not run pinned old verifiers
wf=text('.github/workflows/deploy-pages.yml')
ok('v20.19.0' in wf,'workflow not v20.19')
# Local HTML refs
for f in pages:
    soup=BeautifulSoup(text(f),'html.parser')
    for tag in soup.find_all(src=True):
        u=tag.get('src','').split('?',1)[0]
        if not u or u.startswith(('http:','https:','data:','blob:')): continue
        p=(ROOT/f).parent/u
        ok(p.resolve().exists(),f'{f} missing src {u}')
    for tag in soup.find_all(href=True):
        u=tag.get('href','')
        if not u or u.startswith(('#','http:','https:','mailto:','tel:','javascript:')): continue
        u=u.split('#',1)[0].split('?',1)[0]
        if not u: continue
        p=(ROOT/f).parent/u
        ok(p.resolve().exists(),f'{f} missing href {u}')
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
    print('FAIL v20.19 Aqua Glass verifier')
    for e in errors: print('-',e)
    sys.exit(1)
print('PASS v20.19 Aqua Glass verifier')
print('pages',len(pages),'adult bones',len(items))
