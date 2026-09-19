#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote

ROOT=Path(__file__).resolve().parents[1]
errors=[]; notes=[]

def fail(msg): errors.append(msg)
def ok(msg): notes.append(msg)

def rel_exists(base:Path, raw:str)->bool:
    if not raw or raw.startswith(('#','http://','https://','mailto:','tel:','javascript:','data:','blob:')): return True
    raw=unquote(raw.split('#',1)[0].split('?',1)[0])
    if not raw:return True
    p=(base/raw).resolve()
    try:p.relative_to(ROOT.resolve())
    except ValueError:return True
    return p.exists()

class RefParser(HTMLParser):
    def __init__(self,path): super().__init__(); self.path=path; self.ids={}; self.password_inputs=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d:self.ids[d['id']]=self.ids.get(d['id'],0)+1
        for attr in ('src','href','poster'):
            if attr in d and not rel_exists(self.path.parent,d[attr]):fail(f'{self.path.name}: broken {tag}[{attr}] -> {d[attr]}')
        if tag=='input' and str(d.get('type','')).lower()=='password':self.password_inputs.append(d)

# required release surface
required=['index.html','app.html','anatomy.html','ai.html','admin.html','offline.html','about.html','privacy.html','terms.html','manifest.webmanifest','sw.js','version.json','ai-config.json','data/index.json','data/packs.json','data/anatomy/manifest.json','cloudflare-worker/src/index.js','supabase/schema.sql']
for f in required:
    if not (ROOT/f).exists(): fail(f'missing required file: {f}')

# JSON
json_files=list(ROOT.rglob('*.json'))
for p in json_files:
    try:json.loads(p.read_text('utf-8'))
    except Exception as e:fail(f'invalid JSON {p.relative_to(ROOT)}: {e}')
ok(f'{len(json_files)} JSON files parse')

# HTML references + duplicate IDs + login password prohibition
for p in ROOT.glob('*.html'):
    parser=RefParser(p)
    try:parser.feed(p.read_text('utf-8'))
    except Exception as e: fail(f'{p.name}: HTML parse error: {e}')
    for k,v in parser.ids.items():
        if v>1:fail(f'{p.name}: duplicate id {k} x{v}')
    if p.name=='index.html' and parser.password_inputs:fail('index.html contains a password input; login must remain Google-only')
ok('HTML local references and duplicate IDs checked')

# CSS local url() references
url_re=re.compile(r'url\(([^)]+)\)')
for p in ROOT.rglob('*.css'):
    txt=p.read_text('utf-8',errors='replace')
    for raw in url_re.findall(txt):
        v=raw.strip().strip('"\'')
        if not rel_exists(p.parent,v):fail(f'{p.relative_to(ROOT)}: broken CSS url -> {v}')
ok('CSS URL references checked')

# Service-worker core paths
sw=(ROOT/'sw.js').read_text('utf-8')
m=re.search(r'const CORE=\[(.*?)\];',sw,re.S)
if not m:fail('sw.js CORE list not found')
else:
    refs=re.findall(r"['\"]([^'\"]+)['\"]",m.group(1))
    for u in refs:
        if u!='./' and not rel_exists(ROOT,u):fail(f'sw.js missing CORE asset: {u}')
    ok(f'Service worker CORE: {len(refs)} paths')

# PWA icons
manifest=json.loads((ROOT/'manifest.webmanifest').read_text('utf-8'))
for icon in manifest.get('icons',[]):
    if not rel_exists(ROOT,icon.get('src','')):fail(f'manifest icon missing: {icon.get("src")}')

# Offline pack paths
packs=json.loads((ROOT/'data/packs.json').read_text('utf-8'))
pack_urls=0
for pack in packs.get('packs',[]):
    for u in pack.get('urls',[]):
        pack_urls+=1
        if not rel_exists(ROOT,u):fail(f'offline pack {pack.get("id")}: missing {u}')
ok(f'Offline packs: {len(packs.get("packs",[]))} packs / {pack_urls} URLs')

# Anatomy manifest references and meaningful OBJ content
anat=json.loads((ROOT/'data/anatomy/manifest.json').read_text('utf-8'))
model_urls=[]
for layer,v in anat.get('layers',{}).items(): model_urls.extend(v.get('lods',{}).values())
model_urls.extend(v.get('url') for v in anat.get('regions',{}).values())
for u in model_urls:
    if not rel_exists(ROOT,u):fail(f'anatomy manifest missing model: {u}'); continue
    p=ROOT/u.removeprefix('./')
    if p.suffix.lower()=='.obj':
        if p.stat().st_size<200:fail(f'anatomy OBJ suspiciously small: {u}')
        head=p.open('r',encoding='utf-8',errors='ignore').read(8192)
        if '\nv ' not in '\n'+head and not head.startswith('v '):fail(f'anatomy OBJ has no vertex records near start: {u}')
ok(f'Anatomy manifest: {len(model_urls)} model references')

# Bundled dictionary integrity: index must describe what the ZIP really contains.
idx=json.loads((ROOT/'data/index.json').read_text('utf-8'))
cat_items=[]
for c in idx.get('categories',[]):
    files=c.get('files') or ([c.get('file')] if c.get('file') else [])
    count=0
    for fn in files:
        p=ROOT/'data/categories'/fn
        if not p.exists():fail(f'category {c.get("id")}: missing {fn}'); continue
        part=json.loads(p.read_text('utf-8')); count+=len(part); cat_items.extend(part)
    if count!=int(c.get('count',count)):fail(f'category {c.get("id")}: index count {c.get("count")} != file count {count}')
search_terms=idx.get('terms',[])
if int(idx.get('term_count',-1))!=len(search_terms):fail(f'data/index.json term_count {idx.get("term_count")} != terms length {len(search_terms)}')
cat_ids={str(x.get('id')) for x in cat_items}; search_ids={str(x.get('id')) for x in search_terms}
if cat_ids!=search_ids:fail(f'dictionary index/category mismatch: {len(search_ids)} indexed IDs vs {len(cat_ids)} category IDs')
ok(f'Bundled dictionary coherent: {len(search_terms)} terms / {len(idx.get("categories",[]))} categories')

# Security: service-role key name is allowed in worker/docs, but never a literal JWT/key in frontend.
frontend='\n'.join((ROOT/p).read_text('utf-8',errors='ignore') for p in ['index.html','app.html','admin.html','assets/js/config.js','assets/js/auth.js'])
if 'SUPABASE_SERVICE_ROLE_KEY' in frontend:fail('frontend mentions SUPABASE_SERVICE_ROLE_KEY; service-role secrets must remain server-side')
if re.search(r'(?i)(service[_-]?role[^\n]{0,30})(eyJ[A-Za-z0-9_-]{40,}|sb_secret_[A-Za-z0-9_-]{15,})',frontend):fail('possible service-role secret found in frontend')
ok('Frontend secret scan passed')

# Free-only AI guard
worker=(ROOT/'cloudflare-worker/src/index.js').read_text('utf-8')
for token in ["const FREE_ONLY=true","env.AI.run","SUPABASE_SERVICE_ROLE_KEY"]:
    if token not in worker:fail(f'AI worker missing expected guard/binding token: {token}')
if re.search(r'openai|anthropic|paid fallback',worker,re.I):
    # "No paid fallback" is okay; actual provider references are not.
    bad=[ln for ln in worker.splitlines() if re.search(r'openai|anthropic',ln,re.I)]
    if bad:fail('AI worker contains unexpected paid-provider reference')
ok('AI worker free-only architecture checked')

# Theme coverage: every main app page must load shared v19 core; Anatomy must be theme-aware.
for name in ['index.html','app.html','ai.html','anatomy.html','admin.html','about.html','offline.html']:
    txt=(ROOT/name).read_text('utf-8')
    if 'v19-core.js' not in txt:fail(f'{name}: shared v19-core.js missing')
if 'global theme compatibility for the 3D Anatomy workspace' not in (ROOT/'assets/css/v19-anatomy.css').read_text('utf-8'):
    fail('3D Anatomy global theme compatibility block missing')
ok('Shared theme/PWA core coverage checked')

if errors:
    print('FINAL AUDIT FAILED')
    for e in errors:print(' -',e)
    sys.exit(1)
print('FINAL AUDIT PASSED')
for n in notes:print(' ✓',n)
