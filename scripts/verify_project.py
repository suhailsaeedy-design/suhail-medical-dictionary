#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json, subprocess, sys, re, tempfile
ROOT=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
    def error(self,message): pass

def main():
    failures=[]
    html_files=sorted(ROOT.glob('*.html'))
    for p in html_files:
        try:
            html=p.read_text(encoding='utf-8'); Parser().feed(html)
            ids=re.findall(r'\bid=["\']([^"\']+)["\']',html)
            for ident in sorted(set(ids)):
                if ids.count(ident)>1: failures.append(f'{p.name}: duplicate id {ident!r}')
            refs=re.findall(r'\b(?:src|href)=["\']([^"\']+)["\']',html)
            for ref in refs:
                if not ref.startswith(('./','../','assets/','data/')): continue
                clean=ref.split('?',1)[0].split('#',1)[0]
                if not clean or clean.endswith('/'): continue
                target=(p.parent/clean).resolve()
                if not target.exists(): failures.append(f'{p.name}: missing local reference {ref}')
            for i,code in enumerate(re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S)):
                if not code.strip(): continue
                with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as tmp:
                    tmp.write(code); name=tmp.name
                r=subprocess.run(['node','--check',name],capture_output=True,text=True); Path(name).unlink(missing_ok=True)
                if r.returncode: failures.append(f'{p.name} inline script #{i+1}: {r.stderr.strip()}')
        except Exception as e: failures.append(f'{p.name}: {e}')
    jsons=[ROOT/'manifest.webmanifest',ROOT/'version.json',ROOT/'data'/'index.json',*sorted((ROOT/'data'/'categories').glob('*.json'))]
    for p in jsons:
        try: json.loads(p.read_text(encoding='utf-8'))
        except Exception as e: failures.append(f'{p}: invalid JSON: {e}')
    for p in [*sorted((ROOT/'assets'/'js').glob('*.js')),ROOT/'sw.js']:
        r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
        if r.returncode: failures.append(f'{p}: {r.stderr.strip()}')
    try:
        index=json.loads((ROOT/'data'/'index.json').read_text(encoding='utf-8'))
        for c in index.get('categories',[]):
            files=c.get('files') or ([c.get('file')] if c.get('file') else [])
            for f in files:
                if not (ROOT/'data'/'categories'/f).exists(): failures.append(f'Missing data file: {f}')
    except Exception as e: failures.append(f'Data index check failed: {e}')
    if failures:
        print('\n'.join(failures),file=sys.stderr); return 1
    print(f'Project verification passed: {len(html_files)} HTML pages, {len(jsons)} JSON files, and all JavaScript syntax checks.')
    return 0
if __name__=='__main__': raise SystemExit(main())
