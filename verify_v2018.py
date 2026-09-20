from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parent
errs=[]
def ok(c,msg):
    if not c: errs.append(msg)

def txt(rel): return (ROOT/rel).read_text(encoding='utf-8',errors='ignore')
# versions
v=json.loads(txt('version.json')); ok(v.get('version')=='20.18.1','version.json not 20.18.1')
for rel in ['index.html','app.html','anatomy.html','ai.html']:
    t=txt(rel); ok('v20-18-polish.css' in t,f'{rel} missing v20-18-polish.css'); ok('v20-18-polish.js' in t,f'{rel} missing v20-18-polish.js')
# login
index=txt('index.html'); loginjs=txt('assets/js/v20-login.js'); cfg=txt('assets/js/config.js')
ok('type="password"' not in index,'public login contains password field')
# Email input is allowed only inside offline fallback modal.
ok('Sign in with current email' in index and 'Sign in with Other email' in index,'two login actions missing')
ok("prompt','select_account'" in txt('assets/js/auth.js'),'Google OAuth select_account prompt missing')
ok('signInWithGoogle(redirect)' in loginjs,'Other email does not invoke Google sign-in')
ok("supabaseUrl: 'https://qdfylefkkkyjwtqqiuye.supabase.co'" in cfg,'Google/Supabase public auth URL not configured')
ok('googleAccountChooser: true' in cfg,'googleAccountChooser config missing')
# shell/mobile
a=txt('app.html'); ok('>Dashboard<' not in a,'Dashboard still present in app sidebar'); ok('>Admin Panel<' not in a,'Admin Panel still present in app sidebar')
polish=txt('assets/css/v20-18-polish.css'); ok('.med-sidebar .med-nav-item>span:not(.nav-ico)' in polish,'mobile drawer label fix missing'); ok('v2018-mobile-nav' in polish or '--v2018-mobile-nav' in polish,'mobile nav polish missing')
# anatomy
man=json.loads(txt('data/anatomy/manifest.json')); adult=json.loads(txt('data/anatomy/adult-bones.json')); anatomy=txt('anatomy.html'); anjs=txt('assets/js/v20-anatomy.js')
ok(adult.get('adult_bone_count')==206 and len(adult.get('bones',[]))==206,'adult bone catalog is not 206')
keys=[b['key'] for b in adult['bones']]; ok(len(set(keys))==206,'adult bone keys not unique')
for b in adult['bones']:
    ok(bool(b.get('name') and b.get('overview') and b.get('location') and b.get('latin')),f"bone metadata incomplete: {b.get('key')}")
    u=b.get('url','').replace('./',''); ok((ROOT/u).is_file(),f"bone model missing: {u}")
layer=man['layers']['skeleton']; ok('adult206/adult-skeleton-male.obj' in json.dumps(layer),'adult male skeleton not wired'); ok('adult206/adult-skeleton-female.obj' in json.dumps(layer),'adult female skeleton not wired')
ok('adult-skeleton-206' in man.get('presets',{}),'206 bone preset missing')
ok('206 Adult Bones' in anatomy,'206 Bones UI entry missing')
ok('Pronounce' in anatomy and 'Auto voice' in anatomy,'anatomy voice controls missing')
ok('pickAdultBone' in anjs and 'highlighted in adult skeleton' in anjs,'bone click/highlight logic missing')
ok('<select id="lodSelect"' not in anatomy and '<option value="low"' not in anatomy and '<option value="standard"' not in anatomy and '<option value="ultra"' not in anatomy,'visible anatomy quality selector remains')
# packs
packs=json.loads(txt('data/packs.json')); ids=[p['id'] for p in packs['packs']]; ok('anatomy-ultra' not in ids,'Ultra offline pack still user-facing')
for p in packs['packs']:
    for u in p.get('urls',[]):
        if u.startswith('./'):
            ok((ROOT/u[2:]).exists(),f"pack {p['id']} missing {u}")
# service worker core refs: only simple local string refs
sw=txt('sw.js')
for u in re.findall(r"'\./([^']+)'",sw):
    # skip dynamic/fallback nonexistent edge cases
    if u and not u.startswith('http'):
        ok((ROOT/u).exists(),f'service worker missing ./{u}')
# admin route
ok((ROOT/'admin-login.html').is_file(),'admin-login.html missing')
# static HTML local refs
for hp in ROOT.glob('*.html'):
    t=hp.read_text(errors='ignore')
    for ref in re.findall(r'(?:src|href)="(\./[^"?#]+)',t):
        path=ROOT/ref[2:]
        ok(path.exists(),f'{hp.name} broken ref {ref}')
if errs:
    print('FAIL',len(errs))
    for e in errs[:100]: print('-',e)
    sys.exit(1)
print('PASS v20.18.1 verifier')
print('206 adult bones:',len(adult['bones']))
print('anatomy regions:',len(man.get('regions',{})))
print('packs:',len(packs['packs']))
