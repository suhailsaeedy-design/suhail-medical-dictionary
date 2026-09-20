from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parent
errs=[]
def ok(c,m):
    if not c: errs.append(m)
def text(p): return (R/p).read_text(encoding='utf-8',errors='ignore')

v=json.loads(text('version.json'));ok(v.get('version')=='20.18.1','version mismatch')
idx=text('index.html');login=text('assets/js/v20-login.js');auth=text('assets/js/auth.js');app=text('app.html')
# login and consent
ok('type="password"' not in idx,'password field returned')
ok('Sign in with current email' in idx and 'Sign in with Other email' in idx,'two-button login missing')
ok("prompt','select_account'" in auth,'Google select_account missing')
ok('await signInWithGoogle(redirect)' in login,'online Google chooser not wired')
ok('privacy.html?from=consent' in idx and 'terms.html?from=consent' in idx,'consent review links missing')
ok('hasPrivacyConsent(session)' in login and 'rememberPrivacyConsent(session)' in login,'login consent cache missing')
ok("privacy_ack_at:p.privacy_ack_at||null" in auth,'local profile still auto-accepts privacy')
ok('is_owner:false' in auth,'local user still owner')
ok('smd-privacy-consents-v1' in app and "location.replace('./index.html?consent=1')" in app,'dictionary privacy gate missing')
for page in ['anatomy.html','ai.html','offline.html']:
    t=text(page);ok('smd-privacy-consents-v1' in t.split('</head>')[0],f'{page} early privacy guard missing');ok('v20-access-guard.js' in t,f'{page} access guard missing')
for page in ['privacy.html','terms.html']:
    t=text(page);ok('v20-legal-consent.js' in t,f'{page} consent return script missing');ok('data-consent-return' in t,f'{page} consent return button marker missing')
legal=text('assets/js/v20-legal-consent.js');ok("./index.html?consent=1" in legal and 'v20-consent-review-mode' in legal,'legal pages still allow bypass')
# UI/mobile
css=text('assets/css/v20-18-polish.css');js=text('assets/js/v20-18-polish.js')
for token in ['v2018-drawer-close','.v20-reference-grid','.v20-ai-message-list','.v20-login-card','.v20-anatomy-page .v20-region-list']:
    ok(token in css or token in js,f'mobile/UI fix missing: {token}')
ok('[data-v20-mobile="more"]' in js,'mobile More drawer handler missing')
ok('>Dashboard<' not in app and '>Admin Panel<' not in app,'regular sidebar still has Dashboard/Admin')
# anatomy
adult=json.loads(text('data/anatomy/adult-bones.json'));man=json.loads(text('data/anatomy/manifest.json'));anjs=text('assets/js/v20-anatomy.js');an=text('anatomy.html')
bs=adult.get('bones',[]);ok(adult.get('adult_bone_count')==206 and len(bs)==206,'206 adult bone catalog incomplete')
ok(len({b.get('key') for b in bs})==206,'adult bone keys not unique')
for b in bs:
    ok(all(b.get(k) for k in ['name','latin','location','overview','url']),f"bone metadata incomplete: {b.get('key')}")
    u=str(b.get('url','')).removeprefix('./');ok((R/u).is_file(),f'missing bone model: {u}')
ok('pickAdultBone' in anjs and 'highlighted in adult skeleton' in anjs,'adult bone click/highlight missing')
ok('speechSynthesis' in anjs and 'autoVoiceToggle' in anjs,'anatomy voice missing')
ok('adult bones individually selectable' in an.lower(),'206 bones UI note missing')
ok('data-anatomy-sex="male"' in an and 'data-anatomy-sex="female"' in an,'male/female controls missing')
ok('<select id="lodSelect"' not in an and '<option value="standard"' not in an and '<option value="ultra"' not in an,'visible quality selector returned')
# pwa/deploy
sw=text('sw.js');ok('v20-access-guard.js' in sw and 'v20-legal-consent.js' in sw,'new consent scripts not cached')
workflow=text('.github/workflows/deploy-pages.yml');ok('20.18.1' in workflow and 'admin-login.html' in workflow,'GitHub Pages workflow stale')
ok((R/'admin-login.html').is_file(),'admin-login missing')
# local static refs
for hp in R.glob('*.html'):
    t=hp.read_text(errors='ignore')
    for ref in re.findall(r'(?:src|href)="(\./[^"?#]+)',t):
        p=R/ref[2:];ok(p.exists(),f'{hp.name} broken ref {ref}')
# packs refs
packs=json.loads(text('data/packs.json'))
for pack in packs.get('packs',[]):
    for u in pack.get('urls',[]):
        if u.startswith('./'):ok((R/u[2:]).exists(),f"pack {pack.get('id')} missing {u}")
if errs:
    print('FAIL',len(errs));[print('-',e) for e in errs[:160]];sys.exit(1)
print('PASS v20.18.1 final verifier')
print('bones',len(bs),'regions',len(man.get('regions',{})),'packs',len(packs.get('packs',[])))
