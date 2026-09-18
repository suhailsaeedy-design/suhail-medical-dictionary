#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
    def error(self,message): pass

def main():
    failures=[]
    for p in ROOT.glob('*.html'):
        try: Parser().feed(p.read_text(encoding='utf-8'))
        except Exception as e: failures.append(f'{p.name}: {e}')
    for p in [ROOT/'manifest.webmanifest',ROOT/'version.json',ROOT/'data'/'index.json',*sorted((ROOT/'data'/'categories').glob('*.json'))]:
        try: json.loads(p.read_text(encoding='utf-8'))
        except Exception as e: failures.append(f'{p}: invalid JSON: {e}')
    for p in [*sorted((ROOT/'assets'/'js').glob('*.js')),ROOT/'sw.js',ROOT/'cloudflare-worker'/'src'/'index.js']:
        r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
        if r.returncode: failures.append(f'{p}: {r.stderr.strip()}')
    index=json.loads((ROOT/'data'/'index.json').read_text(encoding='utf-8'))
    for c in index.get('categories',[]):
        files=c.get('files') or ([c.get('file')] if c.get('file') else [])
        for f in files:
            if not (ROOT/'data'/'categories'/f).exists(): failures.append(f'Missing data file: {f}')
    if failures:
        print('\n'.join(failures),file=sys.stderr);return 1
    print('Project verification passed.')
    return 0
if __name__=='__main__': raise SystemExit(main())
