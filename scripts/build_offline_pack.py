#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re
from pathlib import Path

def write(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

def bucket(term:str)->str:
    s=(term or '').strip().lower()
    if not s:return '_'
    c=s[0]
    return c if 'a'<=c<='z' else ('0-9' if c.isdigit() else 'other')

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--data-dir',type=Path,default=Path(__file__).resolve().parents[1]/'data');args=ap.parse_args()
    data=args.data_dir.resolve(); idx=json.loads((data/'index.json').read_text(encoding='utf-8'))
    out=data/'offline'; search=out/'search'; search.mkdir(parents=True,exist_ok=True)
    for p in search.glob('*.json'):p.unlink()
    buckets={}
    for t in idx.get('terms',[]):
        key=bucket(t.get('term','')); buckets.setdefault(key,[]).append(t)
    search_files=[]
    for key,items in sorted(buckets.items()):
        fn=f'{key}.json';write(search/fn,items);search_files.append(f'./data/offline/search/{fn}')
    category_files=[]
    for c in idx.get('categories',[]):
        for fn in c.get('files') or ([c.get('file')] if c.get('file') else []):
            category_files.append(f'./data/categories/{fn}')
    manifest={
        'dataset':idx.get('dataset','Suhail Medical Dictionary offline pack'),
        'version':idx.get('version','19'),
        'term_count':len(idx.get('terms',[])),
        'reported_dataset_count':idx.get('term_count',len(idx.get('terms',[]))),
        'searchable_name_count':len(idx.get('terms',[])),
        'search_prefix_files':search_files,
        'category_files':category_files,
        'source_note':idx.get('source_note',''),
        'content_note':idx.get('content_note','')
    }
    write(out/'manifest.json',manifest)
    packs_path=data/'packs.json'
    packs=json.loads(packs_path.read_text(encoding='utf-8')) if packs_path.exists() else {'version':'19.0.0','packs':[]}
    urls=['./data/index.json','./data/offline/manifest.json',*search_files,*category_files]
    pack={'id':'full-offline-dictionary','name':'Full Offline Dictionary','description':'Search index, prefix search shards and category chunks for complete offline terminology lookup. Production GitHub builds populate this from official NLM MeSH 2026.','kind':'dictionary','recommended':True,'sizeLabel':'Build-dependent','urls':list(dict.fromkeys(urls))}
    packs['packs']=[p for p in packs.get('packs',[]) if p.get('id')!='full-offline-dictionary']+[pack]
    packs_path.write_text(json.dumps(packs,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f"Offline pack: {manifest['term_count']:,} locally bundled terms, {len(search_files)} search shards, {len(category_files)} category files")
if __name__=='__main__':main()
