#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys

ROOT=Path(__file__).resolve().parent
SITE=ROOT/'_site'
errors=[]; notes=[]

def read(rel):
    try:return (ROOT/rel).read_text(encoding='utf-8')
    except Exception as e:errors.append(f'read failed {rel}: {e}');return ''
def load(rel):
    try:return json.loads(read(rel))
    except Exception as e:errors.append(f'JSON invalid {rel}: {e}');return {}
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

required=['version.json','sw.js','manifest.webmanifest','data/offline-packs.json','data/index.json','data/clinical-reference.json','data/clinical-calculators.json','data/crosslinks.json','data/anatomy/catalog.json','tools/build_release.py','.github/workflows/deploy-pages.yml','FINAL_RELEASE_REPORT_PASHTO.md']
for rel in required:
    if not (ROOT/rel).is_file():errors.append(f'missing final-release file: {rel}')

ver=load('version.json')
if tuple(map(int,str(ver.get('version','0.0.0')).split('.'))) < (21,16,0):errors.append('release version must be 21.16.0 or newer')
if 'Final Release' not in str(ver.get('release','')):errors.append('version release label must identify Final Release')
if 'Phase 17' not in str(ver.get('scope','')):errors.append('version scope must include Phase 17 final QA')

# Content baselines.
idx=load('data/index.json'); terms=idx.get('terms',[]); cats=idx.get('categories',[])
if len(terms)!=1158:errors.append(f'Dictionary term count changed: {len(terms)} != 1158')
if len(cats)!=17:errors.append(f'Dictionary category count changed: {len(cats)} != 17')
ids=[str(t.get('id','')) for t in terms]
if len(ids)!=len(set(ids)) or '' in ids:errors.append('Dictionary IDs are missing/duplicated')

cref=load('data/clinical-reference.json')
counts=cref.get('counts',{}) if isinstance(cref.get('counts'),dict) else {}
expected={'conditions':185,'procedures':135,'pharmacology':87}
actual={'conditions':int(counts.get('conditions',-1)),'procedures':int(counts.get('procedures',-1)),'pharmacology':int(counts.get('drugs',counts.get('pharmacology',-1)))}
for k,n in expected.items():
    if actual[k]!=n:errors.append(f'Clinical {k} count changed: {actual[k]} != {n}')
calcs=load('data/clinical-calculators.json')
calc_list=calcs.get('calculators',calcs if isinstance(calcs,list) else [])
if len(calc_list)!=7:errors.append(f'calculator count changed: {len(calc_list)} != 7')

catalog=load('data/anatomy/catalog.json')
expected_anat={'skeleton':206,'muscles':50,'joints':24,'ligaments':29,'organs':15,'nerves':24,'vessels':25,'teeth':32,'eye':14,'sinuses':8}
for key,n in expected_anat.items():
    source_key='bones' if key=='skeleton' else key
    rows=catalog.get(source_key,[])
    if len(rows)!=n:errors.append(f'anatomy {key} count changed: {len(rows)} != {n}')
    a=[str(x.get('id','')) for x in rows]
    if len(a)!=len(set(a)) or '' in a:errors.append(f'anatomy {key} IDs missing/duplicated')

cross=load('data/crosslinks.json')
dict_links=cross.get('term_to_anatomy',cross.get('dictionary_to_anatomy',{}))
anat_links=cross.get('anatomy_to_terms',cross.get('anatomy_to_dictionary',{}))
if len(dict_links)!=189:errors.append(f'Dictionary crosslink count changed: {len(dict_links)} != 189')
if len(anat_links)!=250:errors.append(f'Anatomy crosslink count changed: {len(anat_links)} != 250')
term_ids=set(ids)
anat_by_system={}
for key in expected_anat:
    source_key='bones' if key=='skeleton' else key
    anat_by_system[key]={str(x.get('id','')) for x in catalog.get(source_key,[])}
for tid,targets in dict_links.items():
    if tid not in term_ids:errors.append(f'crosslink unknown Dictionary id: {tid}')
    vals=targets if isinstance(targets,list) else [targets]
    for row in vals:
        if not isinstance(row,dict):errors.append(f'crosslink target is not an object for {tid}');continue
        system=str(row.get('system','')); aid=str(row.get('structure_id',''))
        if system not in anat_by_system or aid not in anat_by_system.get(system,set()):errors.append(f'crosslink unknown Anatomy id: {system}:{aid}')
for ref,tids in anat_links.items():
    if ':' not in ref:errors.append(f'reverse crosslink malformed Anatomy reference: {ref}')
    else:
        system,aid=ref.split(':',1)
        if system not in anat_by_system or aid not in anat_by_system.get(system,set()):errors.append(f'reverse crosslink unknown Anatomy id: {ref}')
    vals=tids if isinstance(tids,list) else [tids]
    for tid in vals:
        if tid not in term_ids:errors.append(f'reverse crosslink unknown Dictionary id: {tid}')

# PWA/version/cache coherence.
sw=read('sw.js'); offjs=read('assets/js/offline-packs.js'); upd=read('assets/js/update-manager.js'); packs=load('data/offline-packs.json')
sm=re.search(r"const VERSION='smd-v21-phase(\d+)'",sw)
pm=re.match(r'smd-v21-phase(\d+)-pack-$',str(packs.get('cache_prefix','')))
om=re.search(r"const prefix='smd-v21-phase(\d+)-pack-'",offjs)
if not sm or int(sm.group(1))<17:errors.append('Service Worker cache must be phase17 or newer')
if not pm or int(pm.group(1))<17:errors.append('offline manifest cache prefix must be phase17 or newer')
if not om or int(om.group(1))<17:errors.append('offline runtime cache prefix must be phase17 or newer')
if packs.get('version')!=ver.get('version'):errors.append('offline pack version must match current release')
if f"const CURRENT_VERSION='{ver.get('version')}'" not in upd:errors.append('update manager version must match current release')

# Service Worker core list should match the offline core URL list (ignoring formatting only).
core_match=re.search(r'const CORE=\[(.*?)\];',sw,re.S)
if not core_match:errors.append('Service Worker CORE list not parseable')
else:
    core_urls=re.findall(r"'([^']+)'",core_match.group(1))
    if core_urls!=packs.get('core',{}).get('urls',[]):errors.append('Service Worker CORE list != offline core manifest URLs')

def local_path(url):
    clean=url.split('?',1)[0].split('#',1)[0]
    if clean in ('','./'):return None
    if clean.startswith('./'):clean=clean[2:]
    return ROOT/clean
for sec in [packs.get('core',{})]+packs.get('packs',[]):
    urls=sec.get('urls',[])
    if sec.get('files')!=len(urls):errors.append(f"offline files mismatch: {sec.get('id','core')}")
    total=0
    for url in urls:
        p=local_path(url)
        if p is not None:
            if not p.is_file():errors.append(f'offline URL missing: {url}')
            else:total+=p.stat().st_size
    if sec.get('bytes')!=total:errors.append(f"offline bytes mismatch {sec.get('id','core')}: {sec.get('bytes')} != {total}")

# Security/public configuration boundary.
auth=load('data/auth-config.json'); adm=load('data/admin-config.json'); ai=load('data/ai-config.json')
if auth.get('enabled') is True:
    if not str(auth.get('supabaseUrl','')).startswith('https://') or not str(auth.get('publishableKey','')).startswith('sb_publishable_'):errors.append('activated cloud auth must use HTTPS + publishable key')
else:
    if auth.get('supabaseUrl') or auth.get('publishableKey'):errors.append('disabled cloud auth must remain blank')
if auth.get('security',{}).get('allowServiceRoleInBrowser') is not False:errors.append('service-role browser access must remain false')
if adm.get('cloudAdmin',{}).get('enabled') is not False:errors.append('distributed cloud admin must remain disabled')
if ai.get('zeroCostMode') is not True or ai.get('allowPaidFallback') is not False:errors.append('zero-cost/no-paid-fallback AI invariant changed')
if ai.get('cloud',{}).get('enabled') is not False or ai.get('cloud',{}).get('endpoint'):errors.append('distributed cloud AI must remain disabled/blank')
secret_patterns=[
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'\bsk-[A-Za-z0-9_-]{20,}\b'),re.compile(r'\bgh[pousr]_[A-Za-z0-9_]{20,}\b'),
    re.compile(r'\bxox[baprs]-[A-Za-z0-9-]{20,}\b'),re.compile(r'\bAIza[0-9A-Za-z_-]{20,}\b')]
public_ext={'.html','.js','.css','.json','.webmanifest','.svg','.md'}
for p in ROOT.rglob('*'):
    if not p.is_file() or '_site' in p.parts or p.suffix.lower() not in public_ext:continue
    # SQL/setup docs can contain forbidden *names* but should not contain actual high-entropy credentials; regexes above catch actual keys.
    text=p.read_text(encoding='utf-8',errors='ignore')
    for pat in secret_patterns:
        if pat.search(text):errors.append(f'credential-like secret found in {p.relative_to(ROOT)}')

# HTML accessibility/local-ref/security audit.
class PageParser(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.refs=[];self.controls=[];self.labels=set();self.blank_links=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        if tag=='label' and a.get('for'):self.labels.add(a['for'])
        if tag in ('input','select','textarea'):
            typ=str(a.get('type','')).lower()
            if typ!='hidden':self.controls.append((tag,a))
        key={'script':'src','link':'href','img':'src','source':'src','a':'href'}.get(tag)
        if key and a.get(key):self.refs.append((tag,a,key))
        if tag=='a' and a.get('target')=='_blank':self.blank_links.append(a)

def is_local(ref):return not ref.startswith(('http:','https:','mailto:','tel:','javascript:','#','data:'))
html_pages=sorted(ROOT.glob('*.html'))
for page in html_pages:
    parser=PageParser();parser.feed(page.read_text(encoding='utf-8',errors='ignore'))
    dup={x for x in parser.ids if parser.ids.count(x)>1}
    if dup:errors.append(f'{page.name} duplicate IDs: {sorted(dup)}')
    for tag,a,key in parser.refs:
        ref=a.get(key,'')
        if is_local(ref):
            clean=ref.split('?',1)[0].split('#',1)[0]
            if clean and not (ROOT/clean).exists():errors.append(f'{page.name} missing local ref: {ref}')
        if tag in ('script','link') and ref.startswith(('http:','https:')):errors.append(f'{page.name} has remote runtime dependency: {ref}')
    for tag,a in parser.controls:
        cid=a.get('id',''); named=bool(a.get('aria-label') or a.get('aria-labelledby') or a.get('title') or (cid and cid in parser.labels))
        if not named:errors.append(f'{page.name} unlabeled {tag}: id={cid or "(none)"}')
    for a in parser.blank_links:
        rel=set(str(a.get('rel','')).lower().split())
        if not {'noopener','noreferrer'}.issubset(rel):errors.append(f'{page.name} target=_blank missing noopener noreferrer')

# JS syntax and JSON parse across current source.
js_files=sorted((ROOT/'assets/js').glob('*.js'))+[ROOT/'sw.js']
for p in js_files:
    r=subprocess.run(['node','--check',str(p.relative_to(ROOT))],cwd=ROOT,capture_output=True,text=True)
    if r.returncode:errors.append(f'JS syntax failed {p.relative_to(ROOT)}: {(r.stderr or r.stdout).strip()}')
json_files=[p for p in ROOT.rglob('*') if p.is_file() and (p.suffix=='.json' or p.name.endswith('.webmanifest')) and '_site' not in p.parts]
for p in json_files:
    try:json.loads(p.read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'JSON parse failed {p.relative_to(ROOT)}: {e}')

# Compile project Python QA/build scripts.
py_files=sorted([*ROOT.glob('verify_phase*.py'),*(ROOT/'tools').glob('*.py')])
for p in py_files:
    r=subprocess.run([sys.executable,'-m','py_compile',str(p)],cwd=ROOT,capture_output=True,text=True)
    if r.returncode:errors.append(f'Python compile failed {p.relative_to(ROOT)}: {(r.stderr or r.stdout).strip()}')

# Current GitHub Pages deployment structure.
wf=read('.github/workflows/deploy-pages.yml')
for marker in ['python verify_phase17.py','actions/checkout@v6','actions/configure-pages@v5','actions/upload-pages-artifact@v4','actions/deploy-pages@v4','needs: build','path: _site','pages: write','id-token: write']:
    if marker not in wf:errors.append(f'workflow final marker missing: {marker}')
if 'path: .' in wf:errors.append('workflow must not upload repository root')

# Build twice and require deterministic manifest.
def build_once():
    r=subprocess.run([sys.executable,'tools/build_release.py'],cwd=ROOT,capture_output=True,text=True,timeout=120)
    if r.returncode:errors.append('production build failed: '+(r.stderr or r.stdout).strip());return None
    if 'PRODUCTION_BUILD_PASS' not in r.stdout:errors.append('production builder did not emit PASS marker')
    p=SITE/'release-manifest.json'
    return p.read_bytes() if p.is_file() else None
m1=build_once();m2=build_once()
if m1 is None or m2 is None:errors.append('production release manifest missing')
elif m1!=m2:errors.append('production release manifest is not deterministic')

if SITE.is_dir():
    try:manifest=json.loads((SITE/'release-manifest.json').read_text(encoding='utf-8'))
    except Exception as e:manifest={};errors.append(f'production release manifest invalid: {e}')
    actual={p.relative_to(SITE).as_posix():p for p in SITE.rglob('*') if p.is_file() and p.name!='release-manifest.json'}
    listed={x.get('path'):x for x in manifest.get('files',[]) if isinstance(x,dict)}
    if set(actual)!=set(listed):errors.append(f'production manifest file-set mismatch listed={len(listed)} actual={len(actual)}')
    total=0
    for rel,p in actual.items():
        total+=p.stat().st_size;row=listed.get(rel,{})
        if row.get('bytes')!=p.stat().st_size:errors.append(f'production manifest byte mismatch: {rel}')
        if row.get('sha256')!=sha(p):errors.append(f'production manifest hash mismatch: {rel}')
    if manifest.get('file_count')!=len(actual):errors.append('production manifest file_count mismatch')
    if manifest.get('total_bytes')!=total:errors.append('production manifest total_bytes mismatch')
    if manifest.get('version')!=ver.get('version'):errors.append('production manifest version mismatch')
    for forbidden in ['.github','supabase','tools','__pycache__']:
        if (SITE/forbidden).exists():errors.append(f'development directory leaked into production: {forbidden}')
    for p in SITE.rglob('*'):
        if p.is_symlink():errors.append(f'symlink in production artifact: {p.relative_to(SITE)}')
        if p.is_file() and (p.name.startswith('verify_phase') or p.name.startswith('PHASE') or p.suffix=='.py'):
            errors.append(f'development file leaked into production: {p.relative_to(SITE)}')
    for req in ['index.html','app.html','anatomy.html','ai.html','offline.html','settings.html','about.html','admin-login.html','admin.html','404.html','sw.js','version.json','manifest.webmanifest','release-manifest.json','.nojekyll']:
        if not (SITE/req).is_file():errors.append(f'production missing runtime: {req}')
    if total>=10*1024*1024*1024:errors.append('production artifact exceeds GitHub Pages 10GB artifact limit')

if errors:
    print('PHASE 17 / FINAL RELEASE VERIFY FAIL')
    for e in errors:print('-',e)
    sys.exit(1)
print('PHASE 17 / FINAL RELEASE VERIFY PASS')
print(f"version: {ver.get('version')}")
print(f'dictionary: {len(terms)} terms / {len(cats)} categories')
print('clinical: 185 conditions / 135 procedures-tests / 87 pharmacology concepts / 7 calculators')
print('anatomy systems:', ', '.join(f'{k}={v}' for k,v in expected_anat.items()))
print(f'cross-navigation: {len(dict_links)} Dictionary terms / {len(anat_links)} Anatomy structures')
print(f'source HTML pages: {len(html_pages)}')
print(f'JavaScript syntax: {len(js_files)} files PASS')
print(f'JSON/Webmanifest parse: {len(json_files)} files PASS')
if SITE.is_dir():
    man=json.loads((SITE/'release-manifest.json').read_text(encoding='utf-8'))
    print(f"production artifact: {man.get('file_count')} files / {man.get('total_bytes')} bytes")
    print('release-manifest SHA-256 integrity: PASS')
    print('deterministic production build: PASS')
