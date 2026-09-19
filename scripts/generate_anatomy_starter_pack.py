#!/usr/bin/env python3
from pathlib import Path
import json, math
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/models/anatomy'
DATA=ROOT/'data/anatomy'
for p in [OUT/'low',OUT/'standard',OUT/'hd',OUT/'regions',DATA]: p.mkdir(parents=True,exist_ok=True)

# This pack is an educational/illustrative geometry set generated for the app.
# It is NOT a diagnostic or clinically precise anatomical dataset.

def ellipsoid(center, radii, subdivisions=2):
    m=trimesh.creation.icosphere(subdivisions=subdivisions, radius=1.0)
    m.apply_scale(radii); m.apply_translation(center); return m

def capsule_between(a,b,radius,count=(16,16)):
    a=np.array(a,float); b=np.array(b,float); v=b-a; L=np.linalg.norm(v)
    if L<1e-6: return ellipsoid(a,(radius,radius,radius),2)
    # capsule is aligned to Z, center on origin
    m=trimesh.creation.capsule(height=L, radius=radius, count=count)
    z=np.array([0,0,1.0]); u=v/L
    cross=np.cross(z,u); dot=np.clip(np.dot(z,u),-1,1)
    if np.linalg.norm(cross)>1e-8:
        ang=math.acos(dot); R=rotation_matrix(ang,cross)
        m.apply_transform(R)
    elif dot<0:
        m.apply_transform(rotation_matrix(math.pi,[1,0,0]))
    m.apply_translation((a+b)/2)
    return m

def combine(meshes):
    return trimesh.util.concatenate([m for m in meshes if m is not None])

def export_obj(mesh,path):
    path.write_text(trimesh.exchange.obj.export_obj(mesh, include_normals=True, include_color=False, include_texture=False, digits=7), encoding='utf-8')

def scale_counts(lod):
    return {'low':((10,10),2,24),'standard':((18,18),3,40),'hd':((30,30),4,64),'ultra':((44,44),5,96)}[lod]

def build_skeleton(lod):
    count,sub,ring=scale_counts(lod); M=[]; regions={}
    def add(name,mesh): M.append(mesh); regions.setdefault(name,[]).append(mesh)
    add('skull',ellipsoid((0,1.65,0),(0.19,0.25,0.18),sub))
    add('jaw',ellipsoid((0,1.45,0.03),(0.15,0.08,0.12),max(2,sub-1)))
    # spine
    for y in np.linspace(1.28,-0.42,18): add('spine',ellipsoid((0,float(y),0),(0.055,0.07,0.055),max(1,sub-2)))
    add('sternum',capsule_between((0,1.15,0.09),(0,.35,.09),.035,count))
    # ribs as paired segmented arches
    for i,y in enumerate(np.linspace(1.15,.45,10)):
        w=.28+.07*(1-abs(i-4.5)/5)
        z=.02
        add('rib_cage',capsule_between((0,y,0),(w*.78,y-.02,z),.018,count))
        add('rib_cage',capsule_between((w*.78,y-.02,z),(w,y-.06,.10),.018,count))
        add('rib_cage',capsule_between((0,y,0),(-w*.78,y-.02,z),.018,count))
        add('rib_cage',capsule_between((-w*.78,y-.02,z),(-w,y-.06,.10),.018,count))
    # clavicles / shoulders
    add('shoulders',capsule_between((-.04,1.28,.02),(-.34,1.30,.03),.028,count)); add('shoulders',capsule_between((.04,1.28,.02),(.34,1.30,.03),.028,count))
    # arms
    for side in (-1,1):
        sx=.37*side
        add('upper_arm',capsule_between((sx,1.23,0),(0.53*side,.68,0),.045,count))
        add('forearm',capsule_between((.53*side,.66,0),(.58*side,.12,.02),.033,count))
        add('forearm',capsule_between((.49*side,.66,.02),(.53*side,.12,-.015),.027,count))
        add('hand',ellipsoid((.57*side,-.03,.02),(.075,.13,.035),max(2,sub-1)))
    # pelvis
    add('pelvis',ellipsoid((-.13,-.39,0),(.18,.20,.12),sub)); add('pelvis',ellipsoid((.13,-.39,0),(.18,.20,.12),sub)); add('pelvis',ellipsoid((0,-.40,0),(.10,.15,.09),sub))
    # legs
    for side in (-1,1):
        x=.16*side
        add('thigh',capsule_between((x,-.53,0),(.19*side,-1.30,0),.06,count))
        add('knee',ellipsoid((.19*side,-1.37,.01),(.075,.075,.065),sub))
        add('lower_leg',capsule_between((.19*side,-1.43,0),(.19*side,-2.05,0),.045,count))
        add('lower_leg',capsule_between((.15*side,-1.43,.02),(.15*side,-2.05,.02),.032,count))
        add('foot',ellipsoid((.19*side,-2.17,.09),(.09,.07,.22),sub))
    return combine(M), {k:combine(v) for k,v in regions.items()}

def build_muscles(lod):
    count,sub,_=scale_counts(lod); M=[]; regions={}
    def add(name,mesh): M.append(mesh); regions.setdefault(name,[]).append(mesh)
    add('head_neck',ellipsoid((0,1.58,0),(0.20,.24,.18),sub)); add('trapezius',ellipsoid((0,1.15,-.04),(.34,.28,.12),sub))
    add('chest',ellipsoid((-.15,.92,.10),(.18,.28,.09),sub)); add('chest',ellipsoid((.15,.92,.10),(.18,.28,.09),sub))
    add('abdomen',ellipsoid((0,.35,.08),(.23,.45,.12),sub)); add('back',ellipsoid((0,.42,-.09),(.29,.55,.10),sub))
    for side in (-1,1):
        add('deltoid',ellipsoid((.37*side,1.10,0),(.16,.18,.16),sub))
        add('biceps',capsule_between((.43*side,.94,.02),(.50*side,.55,.03),.075,count)); add('forearm_muscles',capsule_between((.51*side,.49,.02),(.55*side,.06,.02),.058,count))
        add('gluteal',ellipsoid((.16*side,-.48,-.08),(.18,.23,.15),sub))
        add('quadriceps',capsule_between((.16*side,-.57,.05),(.18*side,-1.27,.04),.10,count)); add('hamstrings',capsule_between((.14*side,-.58,-.07),(.17*side,-1.25,-.07),.085,count))
        add('calf',capsule_between((.18*side,-1.46,-.02),(.18*side,-1.98,-.02),.075,count))
    return combine(M), {k:combine(v) for k,v in regions.items()}

def build_organs(lod):
    count,sub,ring=scale_counts(lod); M=[]; regions={}
    def add(name,mesh): M.append(mesh); regions.setdefault(name,[]).append(mesh)
    add('brain',ellipsoid((0,1.68,0),(.17,.20,.15),sub))
    add('left_lung',ellipsoid((-.14,.91,.02),(.14,.34,.12),sub)); add('right_lung',ellipsoid((.14,.91,.02),(.14,.34,.12),sub))
    # stylized heart cluster
    add('heart',ellipsoid((-.045,.72,.13),(.09,.12,.09),sub)); add('heart',ellipsoid((.045,.72,.13),(.09,.12,.09),sub)); add('heart',capsule_between((0,.66,.13),(0,.48,.13),.08,count))
    add('liver',ellipsoid((.13,.35,.08),(.28,.14,.16),sub)); add('stomach',ellipsoid((-.13,.25,.10),(.12,.20,.10),sub)); add('pancreas',ellipsoid((0,.20,.12),(.20,.055,.055),sub))
    add('left_kidney',ellipsoid((-.18,.02,-.02),(.08,.13,.06),sub)); add('right_kidney',ellipsoid((.18,.02,-.02),(.08,.13,.06),sub))
    add('spleen',ellipsoid((-.25,.30,.02),(.07,.12,.06),sub)); add('bladder',ellipsoid((0,-.45,.05),(.09,.11,.08),sub))
    # intestines as torus-like loops
    for j,y in enumerate([-.05,-.18,-.31]):
        t=trimesh.creation.torus(major_radius=.18-.02*j, minor_radius=.022, major_sections=ring, minor_sections=max(10,ring//3))
        t.apply_scale((1,.55,1)); t.apply_transform(rotation_matrix(math.pi/2,[1,0,0])); t.apply_translation((0,y,.09)); add('intestines',t)
    return combine(M), {k:combine(v) for k,v in regions.items()}

def build_systems(lod):
    count,sub,_=scale_counts(lod); M=[]; regions={}
    def add(name,mesh): M.append(mesh); regions.setdefault(name,[]).append(mesh)
    add('brain_nerves',ellipsoid((0,1.68,0),(.17,.20,.15),sub)); add('spinal_cord',capsule_between((0,1.40,-.02),(0,-.55,-.02),.025,count))
    # main vessels / nerve branches
    add('cardiovascular',capsule_between((0,.72,.10),(0,-.45,.06),.030,count)); add('cardiovascular',capsule_between((0,.75,.10),(-.42,.85,.05),.022,count)); add('cardiovascular',capsule_between((0,.75,.10),(.42,.85,.05),.022,count))
    for side in (-1,1):
        add('peripheral_nerves',capsule_between((0,1.18,-.02),(.48*side,.75,0),.018,count)); add('peripheral_nerves',capsule_between((.48*side,.75,0),(.56*side,.05,0),.014,count))
        add('peripheral_nerves',capsule_between((0,-.38,-.02),(.18*side,-1.1,0),.018,count)); add('peripheral_nerves',capsule_between((.18*side,-1.1,0),(.18*side,-2.05,0),.014,count))
    # lymph node markers
    for p in [(-.22,.98,.05),(.22,.98,.05),(-.18,.18,.05),(.18,.18,.05),(-.16,-.45,.05),(.16,-.45,.05)]: add('lymphatic',ellipsoid(p,(.035,.05,.035),max(2,sub-1)))
    return combine(M), {k:combine(v) for k,v in regions.items()}

builders={'skeleton':build_skeleton,'muscles':build_muscles,'organs':build_organs,'systems':build_systems}
colors={'skeleton':[0.80,0.92,1.0,1],'muscles':[0.92,0.24,0.30,1],'organs':[0.91,0.40,0.30,1],'systems':[0.20,0.72,1.0,1]}
manifest={'version':'19.0.0','kind':'illustrative-anatomy-starter','medical_precision':'educational illustration only; not diagnostic','layers':{},'regions':{}}
for lod in ('low','standard','hd','ultra'):
    for layer,builder in builders.items():
        mesh,regions=builder(lod)
        path=OUT/lod/f'{layer}.obj'; export_obj(mesh,path)
        manifest['layers'].setdefault(layer,{'color':colors[layer],'lods':{},'regions':[]})['lods'][lod]=f'./assets/models/anatomy/{lod}/{layer}.obj'
        if lod=='standard':
            for name,rmesh in regions.items():
                rpath=OUT/'regions'/f'{layer}-{name}.obj'; export_obj(rmesh,rpath)
                key=f'{layer}:{name}'; manifest['regions'][key]={'layer':layer,'name':name.replace('_',' ').title(),'url':f'./assets/models/anatomy/regions/{layer}-{name}.obj','color':colors[layer]}
                manifest['layers'][layer]['regions'].append(key)
(DATA/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(DATA/'README.md').write_text('''# Suhail Illustrative 3D Anatomy Starter Pack\n\nThis bundled geometry is generated for interactive educational UI testing and general anatomy orientation. It is **not** a clinically precise anatomical dataset and must not be used for diagnosis, surgery planning, or measurement.\n\nThe project also includes `BODY_PARTS3D_IMPORT_GUIDE.md` for importing the official BodyParts3D mesh database when a validated external dataset is available.\n''',encoding='utf-8')
print('generated', sum(p.stat().st_size for p in OUT.rglob('*.obj'))/1024/1024, 'MiB OBJ')
