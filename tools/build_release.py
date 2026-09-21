#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import hashlib, json, shutil, sys
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '_site'

RUNTIME_FILES = [
    '.nojekyll',
    'index.html','app.html','anatomy.html','ai.html','offline.html','settings.html','about.html',
    'privacy.html','terms.html','auth-callback.html','admin-login.html','admin.html','owner-setup.html','404.html',
    'manifest.webmanifest','sw.js','version.json','THIRD_PARTY_NOTICES.md',
]
RUNTIME_DIRS = ['assets','data']
FORBIDDEN_TOP_LEVEL = {
    '.github','supabase','tools','_site','__pycache__'
}
FORBIDDEN_PREFIXES = ('verify_phase','PHASE')

class RefParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        key={'script':'src','img':'src','link':'href','a':'href','source':'src'}.get(tag)
        if key and a.get(key): self.refs.append(a[key])


def sha256(path: Path) -> str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024), b''): h.update(chunk)
    return h.hexdigest()


def copy_tree(src: Path, dst: Path):
    if src.is_symlink(): raise RuntimeError(f'symlink forbidden: {src.relative_to(ROOT)}')
    if src.is_dir():
        dst.mkdir(parents=True, exist_ok=True)
        for child in sorted(src.iterdir()): copy_tree(child, dst/child.name)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src,dst)


def local_ref_target(page: Path, ref: str) -> Path | None:
    if not ref or ref.startswith(('http:','https:','mailto:','tel:','javascript:','#','data:')): return None
    clean=ref.split('?',1)[0].split('#',1)[0]
    if not clean: return None
    if clean.startswith('/'):
        # Root-relative URLs are intentionally not used in this project because GitHub project Pages may live under a subpath.
        return OUT / clean.lstrip('/')
    return (page.parent / clean).resolve()


def audit_site():
    errors=[]
    for required in RUNTIME_FILES:
        if not (OUT/required).is_file(): errors.append(f'missing runtime file: {required}')
    for d in RUNTIME_DIRS:
        if not (OUT/d).is_dir(): errors.append(f'missing runtime directory: {d}')
    for p in OUT.rglob('*'):
        rel=p.relative_to(OUT)
        top=rel.parts[0] if rel.parts else ''
        if top in FORBIDDEN_TOP_LEVEL: errors.append(f'development path leaked into release: {rel}')
        if p.is_file() and (p.name.startswith(FORBIDDEN_PREFIXES) or p.name.endswith('.py')):
            errors.append(f'development file leaked into release: {rel}')
        if p.is_symlink(): errors.append(f'symlink in release: {rel}')
    for html in OUT.glob('*.html'):
        parser=RefParser(); parser.feed(html.read_text(encoding='utf-8'))
        for ref in parser.refs:
            target=local_ref_target(html,ref)
            if target is not None and not target.exists():
                errors.append(f'{html.name}: missing local reference {ref}')
    # CSS url(...) references must also resolve inside the production artifact.
    import re
    for css in OUT.rglob('*.css'):
        text=css.read_text(encoding='utf-8',errors='ignore')
        for raw in re.findall(r'url\(([^)]+)\)', text):
            ref=raw.strip().strip('\"\'')
            if not ref or ref.startswith(('data:','http:','https:','#')): continue
            target=(css.parent/ref.split('?',1)[0].split('#',1)[0]).resolve()
            if not target.exists(): errors.append(f'{css.relative_to(OUT)}: missing CSS asset {ref}')
    # Validate JSON before deployment.
    for p in OUT.rglob('*.json'):
        try: json.loads(p.read_text(encoding='utf-8'))
        except Exception as e: errors.append(f'invalid JSON {p.relative_to(OUT)}: {e}')
    # Public config may contain a publishable Supabase key, but never privileged credentials.
    for name in ['data/auth-config.json','data/admin-config.json','data/ai-config.json']:
        p=OUT/name
        if not p.exists(): continue
        text=p.read_text(encoding='utf-8').lower()
        for forbidden in ['service_role_key','service-role-key','supabase_secret_key','database_password']:
            if forbidden in text: errors.append(f'privileged secret field marker in public config: {name}')
    if errors:
        raise RuntimeError('\n'.join(errors))


def build_manifest():
    version=json.loads((OUT/'version.json').read_text(encoding='utf-8'))
    entries=[]
    total=0
    for p in sorted(x for x in OUT.rglob('*') if x.is_file() and x.name!='release-manifest.json'):
        rel=p.relative_to(OUT).as_posix(); size=p.stat().st_size; total+=size
        entries.append({'path':rel,'bytes':size,'sha256':sha256(p)})
    manifest={
        'format':1,
        'product':'Suhail Medical Dictionary',
        'version':version.get('version'),
        'release':version.get('release'),
        'file_count':len(entries),
        'total_bytes':total,
        'files':entries,
    }
    (OUT/'release-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')


def main():
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for rel in RUNTIME_FILES:
        src=ROOT/rel
        if not src.is_file(): raise RuntimeError(f'required source runtime file missing: {rel}')
        copy_tree(src,OUT/rel)
    for rel in RUNTIME_DIRS:
        src=ROOT/rel
        if not src.is_dir(): raise RuntimeError(f'required source runtime directory missing: {rel}')
        copy_tree(src,OUT/rel)
    audit_site()
    build_manifest()
    # Ensure the manifest is itself valid and does not alter listed hashes.
    json.loads((OUT/'release-manifest.json').read_text(encoding='utf-8'))
    manifest=json.loads((OUT/'release-manifest.json').read_text(encoding='utf-8'))
    print(f"PRODUCTION_BUILD_PASS files={manifest['file_count']} bytes={manifest['total_bytes']} version={manifest['version']}")

if __name__=='__main__':
    try: main()
    except Exception as e:
        print(f'PRODUCTION_BUILD_FAIL: {e}', file=sys.stderr)
        sys.exit(1)
