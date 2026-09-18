#!/usr/bin/env python3
from __future__ import annotations
import argparse, datetime as dt, os, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'_site'
PUBLIC_FILES=['index.html','app.html','ai.html','admin.html','about.html','privacy.html','terms.html','offline.html','manifest.webmanifest','version.json','ai-config.json','sw.js']
PUBLIC_DIRS=['assets','data']

def copy_tree():
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for name in PUBLIC_FILES:
        p=ROOT/name
        if p.exists(): shutil.copy2(p,OUT/name)
    for name in PUBLIC_DIRS:
        p=ROOT/name
        if p.exists(): shutil.copytree(p,OUT/name)

def stamp():
    version=os.getenv('GITHUB_SHA','')[:12] or dt.datetime.now(dt.timezone.utc).strftime('%Y%m%d%H%M%S')
    released=dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
    (OUT/'version.json').write_text(f'{{"version":"{version}","releasedAt":"{released}"}}\n',encoding='utf-8')
    sw=(OUT/'sw.js').read_text(encoding='utf-8').replace('__BUILD_VERSION__',version)
    (OUT/'sw.js').write_text(sw,encoding='utf-8')
    return version

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--import-mesh',action='store_true'); args=ap.parse_args()
    copy_tree()
    if args.import_mesh:
        subprocess.run([sys.executable,str(ROOT/'scripts'/'import_mesh_2026.py'),'--output-dir',str(OUT/'data')],check=True)
    v=stamp(); print(f'Release {v} ready at {OUT}')
if __name__=='__main__': main()
