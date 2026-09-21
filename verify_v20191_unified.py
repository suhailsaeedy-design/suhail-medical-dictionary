from pathlib import Path
import re, json, sys
R=Path(__file__).resolve().parent
errs=[]
def check(ok,msg):
    if not ok: errs.append(msg)
app=(R/'app.html').read_text(encoding='utf-8')
anat=(R/'anatomy.html').read_text(encoding='utf-8')
ai=(R/'ai.html').read_text(encoding='utf-8')
css=(R/'assets/css/v20-19-1-unified-shell.css').read_text(encoding='utf-8')
js=(R/'assets/js/v20-19-1-unified-shell.js').read_text(encoding='utf-8')
check('20.19.2' in (R/'version.json').read_text(encoding='utf-8'),'version.json not 20.19.2')
check('href="#clinical-reference"' not in app,'Clinical Reference still in app sidebar')
for name,text in [('anatomy',anat),('ai',ai)]:check('app.html#clinical-reference' not in text,f'Clinical Reference still in {name} sidebar')
for token in ['viewOneButton','viewTwoButton','viewThreeButton','cols-1','cols-2','cols-3']:check(token in app or token in css,f'missing term density feature: {token}')
check('v20191-reference-toggle' in js,'missing Clinical Reference collapse control')
check('v20191-sidebar-collapse' in js and 'v20191-sidebar-collapse' in css,'missing sidebar collapse control')
check('grid-template-columns:40px minmax(92px,1fr) 78px 78px' in css,'mobile topbar layout missing')
check('content:none!important' in css,'duplicate pseudo mobile menu not disabled')
check("activeLayers=new Set([l])" in (R/'assets/js/v20-anatomy.js').read_text(encoding='utf-8'),'anatomy system tabs not exclusive')
check('v20-19-1-unified-shell.css' in (R/'sw.js').read_text(encoding='utf-8'),'new CSS not precached')
check('v20-19-1-unified-shell.js' in (R/'sw.js').read_text(encoding='utf-8'),'new JS not precached')
check('new Response(JSON.stringify({offline:true})' in (R/'sw.js').read_text(encoding='utf-8'),'service worker offline Response fix missing')
check('pwa.js' not in re.sub(r"import\([^)]*pwa\.js[^)]*\)","",anat),'anatomy still loads pwa.js as classic script')

import json as _json
_manifest=_json.loads((R/'data/anatomy/manifest.json').read_text(encoding='utf-8'))
_sk=_manifest['layers']['skeleton']
check(_sk.get('sex_lods',{}).get('male',{}).get('hd')=='./assets/models/anatomy/hd/skeleton-male.obj','male HD skeleton not wired')
check(_sk.get('sex_lods',{}).get('female',{}).get('hd')=='./assets/models/anatomy/hd/skeleton-female.obj','female HD skeleton not wired')
check((R/'assets/models/anatomy/hd/skeleton-male.obj').stat().st_size>8_000_000,'male HD skeleton asset too small')
check((R/'assets/models/anatomy/hd/skeleton-female.obj').stat().st_size>8_000_000,'female HD skeleton asset too small')
if errs:
 print('FAIL'); [print('-',e) for e in errs]; sys.exit(1)
print('PASS v20.19.2 unified shell verification')
