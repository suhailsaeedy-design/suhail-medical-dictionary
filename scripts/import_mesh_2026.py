#!/usr/bin/env python3
"""Build the production Suhail Medical Dictionary from official NLM MeSH 2026.

The release includes the complete MeSH Descriptor vocabulary (main headings) and
all entry terms/synonyms present in the descriptor XML. Data is split into small
static JSON files for mobile/PWA use. No term images or media are imported.
"""
from __future__ import annotations
import argparse, json, re, urllib.request
from pathlib import Path
from xml.etree.ElementTree import iterparse

DEFAULT_URL='https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.xml'
CHUNK_SIZE=700
MIN_PRODUCTION_DESCRIPTORS=25000

SPECIALTIES=[
 ('cardiology','Cardiology',('C14','A07')),
 ('neurology','Neurology & Neuroscience',('C10','A08')),
 ('pulmonology','Pulmonology',('C08','A04')),
 ('gastroenterology','Gastroenterology',('C06','A03')),
 ('endocrinology','Endocrinology & Metabolism',('C19','A06')),
 ('nephrology-urology','Nephrology & Urology',('C12','A05')),
 ('hematology','Hematology',('C15','A15')),
 ('dermatology','Dermatology',('C17','A17')),
 ('oncology','Oncology',('C04',)),
 ('infectious-disease','Infectious Disease',('C01',)),
 ('musculoskeletal','Musculoskeletal & Orthopedics',('C05','A02')),
 ('ophthalmology','Ophthalmology',('C11','A09')),
 ('otolaryngology','ENT / Otolaryngology',('C09','A14')),
 ('dentistry','Dentistry & Oral Health',('C07','A14.549')),
 ('obgyn','Obstetrics & Gynecology',('C13','A05.360')),
 ('pediatrics','Pediatrics & Child Health',('C16',)),
 ('psychiatry','Psychiatry & Psychology',('F03','F04')),
 ('immunology','Immunology',('G12','C20')),
 ('genetics','Genetics & Genomics',('G05',)),
 ('microbiology','Microbiology',('G06','B03','B04')),
 ('pharmacology','Pharmacology & Therapeutics',('D','E02')),
 ('diagnostics','Diagnostics & Clinical Investigation',('E01','E05')),
 ('surgery','Surgery & Procedures',('E04',)),
 ('anatomy','Anatomy',('A',)),
 ('physiology','Physiology & Biological Sciences',('G07','G09','G11')),
 ('public-health','Public Health & Health Care',('N','I01.880')),
 ('medical-informatics','Medical Informatics & Information Science',('L',)),
]
FALLBACK={'B':('organisms','Organisms'),'C':('diseases','Diseases & Conditions'),'D':('drugs-chemicals','Drugs & Chemicals'),
'E':('diagnostics-therapeutics','Diagnostics & Therapeutics'),'F':('behavioral-sciences','Behavioral Sciences'),
'G':('biological-sciences','Biological Sciences'),'H':('physical-sciences','Physical Sciences'),'I':('social-sciences','Social Sciences'),
'J':('technology-food','Technology & Food'),'K':('humanities','Humanities'),'M':('persons','Persons'),
'V':('publication-types','Publication Types'),'Z':('geographicals','Geographicals')}

def text(el,path):
    x=el.find(path); return (x.text or '').strip() if x is not None and x.text else ''
def clean(s): return re.sub(r'\s+',' ',s or '').strip()
def classify(trees):
    for cid,label,prefixes in SPECIALTIES:
        if any(any(t.startswith(p) for p in prefixes) for t in trees): return cid,label
    k=trees[0][:1] if trees else 'C'; return FALLBACK.get(k,('other','Other Medical Topics'))
def write_json(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

def unique_strings(values):
    seen=set(); out=[]
    for raw in values:
        s=clean(raw)
        if not s: continue
        k=s.casefold()
        if k in seen: continue
        seen.add(k); out.append(s)
    return out

def descriptor_explanation(name, scope, annotation, public_note, synonyms):
    parts=[]
    if annotation and annotation.casefold()!=scope.casefold():
        parts.append(annotation)
    if public_note and public_note.casefold() not in {scope.casefold(),annotation.casefold()}:
        parts.append(public_note)
    if not parts:
        if synonyms:
            parts.append(f'Official MeSH 2026 descriptor. Related entry terms include: {", ".join(synonyms[:8])}.')
        else:
            parts.append(f'Official NLM MeSH 2026 descriptor used for biomedical indexing and terminology retrieval: {name}.')
    return clean(' '.join(parts))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--xml',type=Path)
    ap.add_argument('--url',default=DEFAULT_URL)
    ap.add_argument('--output-dir',type=Path,required=False)
    ap.add_argument('--keep-xml',action='store_true')
    ap.add_argument('--allow-small-test-data',action='store_true',help='Disable production minimum count check for local test XML.')
    args=ap.parse_args()
    root=Path(__file__).resolve().parents[1]
    out=(args.output_dir or (root/'data')).resolve()
    xml=(args.xml.resolve() if args.xml else root/'scripts'/'desc2026.xml')
    downloaded=False
    if not xml.exists():
        print('Downloading official NLM MeSH 2026 descriptor XML…')
        urllib.request.urlretrieve(args.url,xml); downloaded=True

    buckets={}; search=[]; alias_total=0
    for _,rec in iterparse(xml,events=('end',)):
        if rec.tag!='DescriptorRecord': continue
        ui=text(rec,'DescriptorUI'); name=clean(text(rec,'DescriptorName/String'))
        if not ui or not name: rec.clear(); continue
        trees=[clean(x.text or '') for x in rec.findall('./TreeNumberList/TreeNumber') if clean(x.text or '')]
        cid,label=classify(trees)
        scope=''
        for c in rec.findall('./ConceptList/Concept'):
            if c.get('PreferredConceptYN')=='Y':
                scope=clean(text(c,'ScopeNote')); break
        annotation=clean(text(rec,'Annotation'))
        public_note=clean(text(rec,'PublicMeSHNote'))
        all_terms=unique_strings(text(t,'String') for t in rec.findall('.//TermList/Term'))
        synonyms=[s for s in all_terms if s.casefold()!=name.casefold()]
        alias_total += len(synonyms)
        definition=scope or annotation or f'Official MeSH descriptor for {name}.'
        explanation=descriptor_explanation(name,scope,annotation,public_note,synonyms)
        item={
            'id':ui,'term':name,'category':cid,'category_label':label,
            'synonyms':synonyms,
            'definition':{'en':definition},
            'explanation':{'en':explanation},
            'localized_term':{},
            'mesh_tree_numbers':trees,
            'source':'U.S. National Library of Medicine (NLM) Medical Subject Headings (MeSH), 2026'
        }
        buckets.setdefault((cid,label),[]).append(item)
        search.append({'id':ui,'term':name,'category':cid,'category_label':label,'synonyms':synonyms})
        rec.clear()

    if not args.allow_small_test_data and len(search) < MIN_PRODUCTION_DESCRIPTORS:
        raise SystemExit(f'Production safety check failed: only {len(search):,} descriptors were parsed; expected at least {MIN_PRODUCTION_DESCRIPTORS:,}.')

    catdir=out/'categories'; catdir.mkdir(parents=True,exist_ok=True)
    for old in catdir.glob('*.json'): old.unlink()
    categories=[]
    for (cid,label),items in sorted(buckets.items(), key=lambda x:x[0][1]):
        items.sort(key=lambda x:x['term'].casefold()); files=[]
        for i in range(0,len(items),CHUNK_SIZE):
            chunk=items[i:i+CHUNK_SIZE]; fn=f'{cid}-{i//CHUNK_SIZE+1:03d}.json'; write_json(catdir/fn,chunk); files.append(fn)
        categories.append({'id':cid,'label':label,'files':files,'count':len(items)})
    search.sort(key=lambda x:x['term'].casefold())
    index={
        'dataset':'NLM Medical Subject Headings (MeSH) — complete 2026 Descriptor vocabulary',
        'version':'2026',
        'term_count':len(search),
        'searchable_name_count':len(search)+alias_total,
        'source_note':'Medical Subject Headings (MeSH) data source: U.S. National Library of Medicine (NLM), 2026. NLM does not endorse this application.',
        'content_note':'All official 2026 MeSH Descriptor records are included. Entry terms and synonyms are searchable. No term images or media are imported.',
        'categories':categories,'terms':search
    }
    write_json(out/'index.json',index)
    print(f'Wrote {len(search):,} MeSH descriptors + {alias_total:,} entry terms/synonyms across {len(categories)} categories and {sum(len(c["files"]) for c in categories)} chunks.')
    if downloaded and not args.keep_xml:
        try: xml.unlink()
        except OSError: pass
if __name__=='__main__': main()
