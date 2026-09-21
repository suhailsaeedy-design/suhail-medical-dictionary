#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def norm(s):
    s=(s or '').lower().replace('&',' and ')
    s=re.sub(r'[^a-z0-9]+',' ',s)
    return ' '.join(s.split())

def base_name(s):
    s=re.sub(r'^(right|left|upper right|upper left|lower right|lower left)\s+','',s or '',flags=re.I)
    return s

idx=json.loads((ROOT/'data/index.json').read_text(encoding='utf-8'))
cat=json.loads((ROOT/'data/anatomy/catalog.json').read_text(encoding='utf-8'))
terms=idx.get('terms',[])
lookup={}
for t in terms:
    vals=[t.get('term','')]+list(t.get('synonyms') or [])
    for v in vals:
        n=norm(v)
        if n:
            lookup.setdefault(n,set()).add(t['id'])

systems=['bones','muscles','joints','ligaments','organs','nerves','vessels','teeth','eye','sinuses']
mode_for={'bones':'skeleton','muscles':'muscles','joints':'joints','ligaments':'ligaments','organs':'organs','nerves':'nerves','vessels':'vessels','teeth':'teeth','eye':'eye','sinuses':'sinuses'}
term_to={}
struct_to={}
for system in systems:
    for s in cat.get(system,[]):
        names=[s.get('name','')]
        exact=[]
        for name in names:
            exact.extend(sorted(lookup.get(norm(name),())))
        generic=[]
        if not exact:
            bn=base_name(s.get('name',''))
            if bn!=s.get('name',''):
                generic.extend(sorted(lookup.get(norm(bn),())))
        tids=[]
        for tid in exact+generic:
            if tid not in tids:tids.append(tid)
        if not tids:continue
        ref={
            'system':mode_for[system],
            'structure_id':s['id'],
            'name':s.get('name',''),
            'latin':s.get('latin',''),
            'location':s.get('location',''),
            'match':'exact' if exact else 'generic-name'
        }
        for tid in tids:
            term_to.setdefault(tid,[]).append(ref)
        struct_to[f"{mode_for[system]}:{s['id']}"] = tids

# deterministic sorting and conservative cap per term
for tid,refs in term_to.items():
    refs.sort(key=lambda x:(0 if x['match']=='exact' else 1,x['system'],x['name']))
    term_to[tid]=refs[:8]
out={
    'schema':'smd21-crosslinks-v1',
    'generated_from':['data/index.json','data/anatomy/catalog.json'],
    'note':'Deterministic exact/generic English-name links between bundled Dictionary terms and bundled schematic Anatomy structures. Links are navigational, not clinical assertions.',
    'term_count':len(term_to),
    'structure_count':len(struct_to),
    'term_to_anatomy':dict(sorted(term_to.items())),
    'anatomy_to_terms':dict(sorted(struct_to.items()))
}
(ROOT/'data/crosslinks.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f"wrote {len(term_to)} term links / {len(struct_to)} anatomy links")
