from pathlib import Path
import json, math
ROOT=Path(__file__).resolve().parent.parent
CAT=ROOT/'data/anatomy/catalog.json'
MODELS=ROOT/'assets/models'

def ellipse(cx,cy,rx,ry,z=0,n=20):
    return [[cx+rx*math.cos(2*math.pi*i/n),cy+ry*math.sin(2*math.pi*i/n),z+0.012*math.sin(4*math.pi*i/n)] for i in range(n)]

def line(a,b,n=6,bend=0):
    out=[]
    for i in range(n):
        t=i/(n-1); x=a[0]*(1-t)+b[0]*t; y=a[1]*(1-t)+b[1]*t; z=a[2]*(1-t)+b[2]*t
        if bend: x += math.sin(math.pi*t)*bend
        out.append([x,y,z])
    return out

def arc(cx,cy,rx,ry,z,a0,a1,n=10):
    return [[cx+rx*math.cos(a0+(a1-a0)*i/(n-1)),cy+ry*math.sin(a0+(a1-a0)*i/(n-1)),z] for i in range(n)]

def entry(id,name,latin,location,description,region,**kw):
    d=dict(id=id,name=name,latin=latin,location=location,description=description,region=region)
    d.update(kw); return d

def obj(id,points,width=.04,closed=False,fill=False,region='trunk',**kw):
    d=dict(id=id,points=points,width=width,closed=closed,fill=fill,region=region); d.update(kw); return d

systems={}
models={}

def add(mode, e, o):
    systems.setdefault(mode,[]).append(e); models.setdefault(mode,[]).append(o)

# JOINTS — paired and central major articulations
joint_defs=[
('temporomandibular-r','Right temporomandibular joint','Articulatio temporomandibularis dextra','Right jaw, anterior to ear','Synovial articulation between the mandibular condyle and temporal bone.','head',(0.38,4.28,0.05),.09,.07),
('temporomandibular-l','Left temporomandibular joint','Articulatio temporomandibularis sinistra','Left jaw, anterior to ear','Synovial articulation between the mandibular condyle and temporal bone.','head',(-0.38,4.28,0.05),.09,.07),
('atlanto-occipital','Atlanto-occipital joint','Articulatio atlantooccipitalis','Base of skull and atlas','Paired synovial articulation permitting primarily flexion and extension of the head.','neck',(0,3.88,0),.16,.07),
('atlanto-axial','Atlanto-axial joint','Articulatio atlantoaxialis','Between atlas and axis','Joint complex that permits much of the head and neck rotation.','neck',(0,3.58,0),.14,.06),
('sternoclavicular-r','Right sternoclavicular joint','Articulatio sternoclavicularis dextra','Medial right clavicle and sternum','Synovial joint linking the upper limb girdle to the axial skeleton.','chest',(0.22,2.74,0.03),.10,.06),
('sternoclavicular-l','Left sternoclavicular joint','Articulatio sternoclavicularis sinistra','Medial left clavicle and sternum','Synovial joint linking the upper limb girdle to the axial skeleton.','chest',(-0.22,2.74,0.03),.10,.06),
('acromioclavicular-r','Right acromioclavicular joint','Articulatio acromioclavicularis dextra','Right shoulder, lateral clavicle','Plane synovial joint between the acromion and clavicle.','shoulder',(0.82,2.63,0.02),.11,.07),
('acromioclavicular-l','Left acromioclavicular joint','Articulatio acromioclavicularis sinistra','Left shoulder, lateral clavicle','Plane synovial joint between the acromion and clavicle.','shoulder',(-0.82,2.63,0.02),.11,.07),
('glenohumeral-r','Right shoulder joint','Articulatio glenohumeralis dextra','Right shoulder','Ball-and-socket synovial joint between the humeral head and glenoid cavity.','shoulder',(0.94,2.39,0.02),.13,.11),
('glenohumeral-l','Left shoulder joint','Articulatio glenohumeralis sinistra','Left shoulder','Ball-and-socket synovial joint between the humeral head and glenoid cavity.','shoulder',(-0.94,2.39,0.02),.13,.11),
('elbow-r','Right elbow joint','Articulatio cubiti dextra','Right elbow','Joint complex linking humerus, radius and ulna for flexion-extension and forearm rotation.','arm',(1.08,1.18,0),.12,.10),
('elbow-l','Left elbow joint','Articulatio cubiti sinistra','Left elbow','Joint complex linking humerus, radius and ulna for flexion-extension and forearm rotation.','arm',(-1.08,1.18,0),.12,.10),
('wrist-r','Right wrist joint','Articulatio radiocarpalis dextra','Right wrist','Radiocarpal joint connecting the distal radius with proximal carpal bones.','arm',(1.22,0.05,0),.11,.08),
('wrist-l','Left wrist joint','Articulatio radiocarpalis sinistra','Left wrist','Radiocarpal joint connecting the distal radius with proximal carpal bones.','arm',(-1.22,0.05,0),.11,.08),
('sacroiliac-r','Right sacroiliac joint','Articulatio sacroiliaca dextra','Right posterior pelvis','Strong joint transferring load between sacrum and ilium.','pelvis',(0.36,-0.72,-0.02),.12,.12),
('sacroiliac-l','Left sacroiliac joint','Articulatio sacroiliaca sinistra','Left posterior pelvis','Strong joint transferring load between sacrum and ilium.','pelvis',(-0.36,-0.72,-0.02),.12,.12),
('pubic-symphysis','Pubic symphysis','Symphysis pubica','Anterior midline pelvis','Secondary cartilaginous joint between the right and left pubic bones.','pelvis',(0,-1.05,0.08),.12,.08),
('hip-r','Right hip joint','Articulatio coxae dextra','Right hip','Ball-and-socket synovial joint between femoral head and acetabulum.','pelvis',(0.52,-1.13,0),.15,.13),
('hip-l','Left hip joint','Articulatio coxae sinistra','Left hip','Ball-and-socket synovial joint between femoral head and acetabulum.','pelvis',(-0.52,-1.13,0),.15,.13),
('knee-r','Right knee joint','Articulatio genus dextra','Right knee','Large synovial joint involving femur, tibia and patella.','leg',(0.48,-3.02,0),.16,.10),
('knee-l','Left knee joint','Articulatio genus sinistra','Left knee','Large synovial joint involving femur, tibia and patella.','leg',(-0.48,-3.02,0),.16,.10),
('ankle-r','Right ankle joint','Articulatio talocruralis dextra','Right ankle','Talocrural hinge joint between tibia/fibula and talus.','leg',(0.45,-4.48,0),.12,.08),
('ankle-l','Left ankle joint','Articulatio talocruralis sinistra','Left ankle','Talocrural hinge joint between tibia/fibula and talus.','leg',(-0.45,-4.48,0),.12,.08),
('lumbosacral','Lumbosacral joint','Articulatio lumbosacralis','Junction of L5 and sacrum','Transition between lumbar spine and sacrum that bears substantial axial load.','pelvis',(0,-0.54,-0.06),.14,.06),
]
for id,nm,la,loc,desc,reg,c,rx,ry in joint_defs:
    add('joints',entry(id,nm,la,loc,desc,reg,label=id in {'glenohumeral-r','elbow-r','hip-r','knee-r','ankle-r','temporomandibular-r'}),obj(id,ellipse(c[0],c[1],rx,ry,c[2],n=18),.026,True,True,reg))

# LIGAMENTS — major educational set
lig_defs=[
('nuchal','Nuchal ligament','Ligamentum nuchae','Posterior cervical midline','Fibrous midline structure supporting the cervical region.','neck',(0,3.72,-.08),(0,2.72,-.10),0),
('anterior-longitudinal','Anterior longitudinal ligament','Ligamentum longitudinale anterius','Anterior vertebral column','Longitudinal spinal ligament extending along anterior vertebral bodies.','back',(0,3.15,.10),(0,-.52,.10),0),
('posterior-longitudinal','Posterior longitudinal ligament','Ligamentum longitudinale posterius','Posterior surfaces of vertebral bodies','Longitudinal spinal ligament within the vertebral canal.','back',(0,3.05,-.08),(0,-.50,-.08),0),
('coracoacromial-r','Right coracoacromial ligament','Ligamentum coracoacromiale dextrum','Right superior shoulder','Ligament spanning coracoid process and acromion.','shoulder',(.68,2.56,.05),(.90,2.68,.04),.04),
('coracoacromial-l','Left coracoacromial ligament','Ligamentum coracoacromiale sinistrum','Left superior shoulder','Ligament spanning coracoid process and acromion.','shoulder',(-.68,2.56,.05),(-.90,2.68,.04),-.04),
('glenohumeral-r','Right glenohumeral ligament complex','Ligamenta glenohumeralia dextra','Right anterior shoulder capsule','Capsular thickenings contributing to glenohumeral stability.','shoulder',(.78,2.48,.08),(1.02,2.25,.08),.04),
('glenohumeral-l','Left glenohumeral ligament complex','Ligamenta glenohumeralia sinistra','Left anterior shoulder capsule','Capsular thickenings contributing to glenohumeral stability.','shoulder',(-.78,2.48,.08),(-1.02,2.25,.08),-.04),
('ulnar-collateral-elbow-r','Right ulnar collateral ligament','Ligamentum collaterale ulnare dextrum','Medial right elbow','Major medial stabilizing ligament complex of the elbow.','arm',(1.02,1.34,.03),(1.13,1.05,.03),.03),
('ulnar-collateral-elbow-l','Left ulnar collateral ligament','Ligamentum collaterale ulnare sinistrum','Medial left elbow','Major medial stabilizing ligament complex of the elbow.','arm',(-1.02,1.34,.03),(-1.13,1.05,.03),-.03),
('transverse-carpal-r','Right transverse carpal ligament','Retinaculum flexorum dextrum','Anterior right wrist','Fibrous roof of the carpal tunnel.','arm',(1.10,.12,.08),(1.31,.04,.08),0),
('transverse-carpal-l','Left transverse carpal ligament','Retinaculum flexorum sinistrum','Anterior left wrist','Fibrous roof of the carpal tunnel.','arm',(-1.10,.12,.08),(-1.31,.04,.08),0),
('iliofemoral-r','Right iliofemoral ligament','Ligamentum iliofemorale dextrum','Anterior right hip','Strong anterior capsular ligament of the hip.','pelvis',(.32,-.94,.08),(.62,-1.28,.10),.06),
('iliofemoral-l','Left iliofemoral ligament','Ligamentum iliofemorale sinistrum','Anterior left hip','Strong anterior capsular ligament of the hip.','pelvis',(-.32,-.94,.08),(-.62,-1.28,.10),-.06),
('pubofemoral-r','Right pubofemoral ligament','Ligamentum pubofemorale dextrum','Anteroinferior right hip','Capsular ligament limiting excessive hip abduction and extension.','pelvis',(.14,-1.05,.08),(.56,-1.30,.07),.04),
('pubofemoral-l','Left pubofemoral ligament','Ligamentum pubofemorale sinistrum','Anteroinferior left hip','Capsular ligament limiting excessive hip abduction and extension.','pelvis',(-.14,-1.05,.08),(-.56,-1.30,.07),-.04),
('acl-r','Right anterior cruciate ligament','Ligamentum cruciatum anterius dextrum','Central right knee','Intracapsular ligament limiting anterior translation of the tibia relative to femur.','leg',(.44,-2.88,.02),(.52,-3.15,-.02),.02),
('acl-l','Left anterior cruciate ligament','Ligamentum cruciatum anterius sinistrum','Central left knee','Intracapsular ligament limiting anterior translation of the tibia relative to femur.','leg',(-.44,-2.88,.02),(-.52,-3.15,-.02),-.02),
('pcl-r','Right posterior cruciate ligament','Ligamentum cruciatum posterius dextrum','Central right knee','Intracapsular ligament limiting posterior translation of the tibia relative to femur.','leg',(.52,-2.88,-.02),(.44,-3.15,.02),-.02),
('pcl-l','Left posterior cruciate ligament','Ligamentum cruciatum posterius sinistrum','Central left knee','Intracapsular ligament limiting posterior translation of the tibia relative to femur.','leg',(-.52,-2.88,-.02),(-.44,-3.15,.02),.02),
('mcl-r','Right tibial collateral ligament','Ligamentum collaterale tibiale dextrum','Medial right knee','Broad medial ligament resisting excessive valgus stress.','leg',(.36,-2.82,0),(.36,-3.22,0),0),
('mcl-l','Left tibial collateral ligament','Ligamentum collaterale tibiale sinistrum','Medial left knee','Broad medial ligament resisting excessive valgus stress.','leg',(-.36,-2.82,0),(-.36,-3.22,0),0),
('lcl-r','Right fibular collateral ligament','Ligamentum collaterale fibulare dextrum','Lateral right knee','Cord-like lateral ligament resisting excessive varus stress.','leg',(.61,-2.82,0),(.61,-3.18,0),0),
('lcl-l','Left fibular collateral ligament','Ligamentum collaterale fibulare sinistrum','Lateral left knee','Cord-like lateral ligament resisting excessive varus stress.','leg',(-.61,-2.82,0),(-.61,-3.18,0),0),
('patellar-r','Right patellar ligament','Ligamentum patellae dextrum','Anterior right knee','Continuation of quadriceps tendon from patella to tibial tuberosity.','leg',(.48,-3.02,.11),(.48,-3.34,.11),0),
('patellar-l','Left patellar ligament','Ligamentum patellae sinistrum','Anterior left knee','Continuation of quadriceps tendon from patella to tibial tuberosity.','leg',(-.48,-3.02,.11),(-.48,-3.34,.11),0),
('atfl-r','Right anterior talofibular ligament','Ligamentum talofibulare anterius dextrum','Anterolateral right ankle','Lateral ankle ligament commonly involved in inversion sprain.','leg',(.54,-4.44,.05),(.67,-4.52,.07),.02),
('atfl-l','Left anterior talofibular ligament','Ligamentum talofibulare anterius sinistrum','Anterolateral left ankle','Lateral ankle ligament commonly involved in inversion sprain.','leg',(-.54,-4.44,.05),(-.67,-4.52,.07),-.02),
('deltoid-ankle-r','Right deltoid ligament','Ligamentum deltoideum dextrum','Medial right ankle','Strong medial collateral ligament complex of the ankle.','leg',(.37,-4.40,.03),(.28,-4.62,.04),-.02),
('deltoid-ankle-l','Left deltoid ligament','Ligamentum deltoideum sinistrum','Medial left ankle','Strong medial collateral ligament complex of the ankle.','leg',(-.37,-4.40,.03),(-.28,-4.62,.04),.02),
]
for i,(id,nm,la,loc,desc,reg,a,b,bend) in enumerate(lig_defs):
    add('ligaments',entry(id,nm,la,loc,desc,reg,label=id in {'anterior-longitudinal','acl-r','mcl-r','atfl-r','iliofemoral-r'}),obj(id,line(a,b,7,bend),.025,False,False,reg))

# ORGANS
organ_defs=[
('brain','Brain','Encephalon','Cranial cavity','Central nervous system organ responsible for integration, cognition, sensation and motor control.','head',(0,4.48,0),.38,.30),
('thyroid','Thyroid gland','Glandula thyroidea','Anterior lower neck','Endocrine gland producing hormones important in metabolism and development.','neck',(0,3.20,.08),.20,.11),
('heart','Heart','Cor','Middle mediastinum, slightly left of midline','Muscular pump that circulates blood through pulmonary and systemic circuits.','chest',(-.15,1.85,.08),.30,.42),
('lung-r','Right lung','Pulmo dexter','Right thoracic cavity','Respiratory organ for gas exchange; the right lung is divided into three lobes.','chest',(.45,2.00,0),.34,.68),
('lung-l','Left lung','Pulmo sinister','Left thoracic cavity','Respiratory organ for gas exchange; the left lung accommodates the cardiac notch.','chest',(-.48,2.00,0),.31,.66),
('liver','Liver','Hepar','Right upper abdomen beneath diaphragm','Large metabolic organ involved in nutrient processing, detoxification and bile production.','abdomen',(.28,.72,.05),.55,.36),
('gallbladder','Gallbladder','Vesica biliaris','Inferior surface of liver','Small reservoir that stores and concentrates bile.','abdomen',(.46,.40,.10),.10,.18),
('stomach','Stomach','Gaster','Left upper abdomen','Muscular digestive organ that receives food and begins mechanical and chemical digestion.','abdomen',(-.31,.45,.05),.31,.38),
('spleen','Spleen','Splen','Left upper abdomen','Lymphoid organ involved in immune surveillance and blood-cell turnover.','abdomen',(-.61,.55,.02),.15,.26),
('pancreas','Pancreas','Pancreas','Upper posterior abdomen','Gland with digestive exocrine functions and endocrine hormone production.','abdomen',(0,.24,.02),.43,.12),
('kidney-r','Right kidney','Ren dexter','Right posterior upper abdomen','Retroperitoneal organ filtering blood and contributing to fluid, electrolyte and endocrine regulation.','abdomen',(.42,.02,-.07),.18,.33),
('kidney-l','Left kidney','Ren sinister','Left posterior upper abdomen','Retroperitoneal organ filtering blood and contributing to fluid, electrolyte and endocrine regulation.','abdomen',(-.42,.12,-.07),.18,.33),
('small-intestine','Small intestine','Intestinum tenue','Central and lower abdomen','Primary site for most nutrient digestion and absorption.','abdomen',(0,-.45,.02),.48,.48),
('colon','Large intestine','Intestinum crassum','Peripheral abdomen','Digestive tract segment involved in water absorption and formation of fecal material.','abdomen',(0,-.52,.02),.66,.64),
('urinary-bladder','Urinary bladder','Vesica urinaria','Anterior pelvis','Muscular reservoir for urine before voiding.','pelvis',(0,-1.22,.06),.20,.24),
]
for id,nm,la,loc,desc,reg,c,rx,ry in organ_defs:
    add('organs',entry(id,nm,la,loc,desc,reg,label=id in {'brain','heart','lung-r','liver','stomach','kidney-r','urinary-bladder'}),obj(id,ellipse(c[0],c[1],rx,ry,c[2],n=22),.018,True,True,reg))
# stylize intestine/colon slightly distinct with extra path overlays retained as one object closed

# NERVES
nerve_defs=[
('optic-r','Right optic nerve','Nervus opticus dexter','Right orbit to optic chiasm','Cranial nerve II pathway carrying visual sensory information.','head',(.18,4.43,.10),(.03,4.32,.02),-.02),
('optic-l','Left optic nerve','Nervus opticus sinister','Left orbit to optic chiasm','Cranial nerve II pathway carrying visual sensory information.','head',(-.18,4.43,.10),(-.03,4.32,.02),.02),
('trigeminal-r','Right trigeminal nerve','Nervus trigeminus dexter','Right face and cranial base','Major sensory nerve of the face with motor fibers to muscles of mastication.','head',(.05,4.28,.02),(.55,4.12,.03),.10),
('trigeminal-l','Left trigeminal nerve','Nervus trigeminus sinister','Left face and cranial base','Major sensory nerve of the face with motor fibers to muscles of mastication.','head',(-.05,4.28,.02),(-.55,4.12,.03),-.10),
('vagus-r','Right vagus nerve','Nervus vagus dexter','Brainstem through neck into thorax and abdomen','Cranial nerve X carrying parasympathetic and sensory fibers to thoracic and abdominal viscera.','neck',(.10,4.00,-.02),(.18,.25,-.03),.10),
('vagus-l','Left vagus nerve','Nervus vagus sinister','Brainstem through neck into thorax and abdomen','Cranial nerve X carrying parasympathetic and sensory fibers to thoracic and abdominal viscera.','neck',(-.10,4.00,-.02),(-.18,.25,-.03),-.10),
('phrenic-r','Right phrenic nerve','Nervus phrenicus dexter','Right neck to diaphragm','Motor supply to the diaphragm with sensory fibers from adjacent thoracic structures.','chest',(.22,3.18,.02),(.35,1.10,.02),.04),
('phrenic-l','Left phrenic nerve','Nervus phrenicus sinister','Left neck to diaphragm','Motor supply to the diaphragm with sensory fibers from adjacent thoracic structures.','chest',(-.22,3.18,.02),(-.35,1.10,.02),-.04),
('brachial-plexus-r','Right brachial plexus','Plexus brachialis dexter','Right lower neck to axilla','Network of spinal nerve fibers supplying most of the upper limb.','shoulder',(.18,3.05,0),(1.02,2.35,0),.16),
('brachial-plexus-l','Left brachial plexus','Plexus brachialis sinister','Left lower neck to axilla','Network of spinal nerve fibers supplying most of the upper limb.','shoulder',(-.18,3.05,0),(-1.02,2.35,0),-.16),
('median-r','Right median nerve','Nervus medianus dexter','Right arm and anterior forearm into hand','Major upper-limb nerve supplying many forearm flexors and thenar muscles and hand sensation.','arm',(.95,2.30,.03),(1.25,-.15,.04),.05),
('median-l','Left median nerve','Nervus medianus sinister','Left arm and anterior forearm into hand','Major upper-limb nerve supplying many forearm flexors and thenar muscles and hand sensation.','arm',(-.95,2.30,.03),(-1.25,-.15,.04),-.05),
('ulnar-r','Right ulnar nerve','Nervus ulnaris dexter','Right medial arm and forearm into hand','Upper-limb nerve with important intrinsic hand motor and sensory functions.','arm',(1.02,2.26,-.03),(1.34,-.12,-.02),.10),
('ulnar-l','Left ulnar nerve','Nervus ulnaris sinister','Left medial arm and forearm into hand','Upper-limb nerve with important intrinsic hand motor and sensory functions.','arm',(-1.02,2.26,-.03),(-1.34,-.12,-.02),-.10),
('radial-r','Right radial nerve','Nervus radialis dexter','Right posterior arm and forearm','Major nerve supplying extensor compartments and portions of dorsal hand sensation.','arm',(1.00,2.30,-.08),(1.18,.08,-.10),-.08),
('radial-l','Left radial nerve','Nervus radialis sinister','Left posterior arm and forearm','Major nerve supplying extensor compartments and portions of dorsal hand sensation.','arm',(-1.00,2.30,-.08),(-1.18,.08,-.10),.08),
('sciatic-r','Right sciatic nerve','Nervus ischiadicus dexter','Right posterior hip and thigh','Largest peripheral nerve, carrying fibers that continue into tibial and common fibular divisions.','leg',(.45,-1.12,-.09),(.52,-3.05,-.10),.08),
('sciatic-l','Left sciatic nerve','Nervus ischiadicus sinister','Left posterior hip and thigh','Largest peripheral nerve, carrying fibers that continue into tibial and common fibular divisions.','leg',(-.45,-1.12,-.09),(-.52,-3.05,-.10),-.08),
('femoral-r','Right femoral nerve','Nervus femoralis dexter','Right pelvis and anterior thigh','Major nerve of anterior thigh supplying hip flexors and knee extensors with sensory branches.','leg',(.30,-.65,.03),(.43,-2.75,.04),.08),
('femoral-l','Left femoral nerve','Nervus femoralis sinister','Left pelvis and anterior thigh','Major nerve of anterior thigh supplying hip flexors and knee extensors with sensory branches.','leg',(-.30,-.65,.03),(-.43,-2.75,.04),-.08),
('tibial-r','Right tibial nerve','Nervus tibialis dexter','Right posterior knee and leg to plantar foot','Terminal branch of sciatic nerve supplying posterior leg and plantar foot structures.','leg',(.52,-3.02,-.04),(.45,-4.72,-.03),.04),
('tibial-l','Left tibial nerve','Nervus tibialis sinister','Left posterior knee and leg to plantar foot','Terminal branch of sciatic nerve supplying posterior leg and plantar foot structures.','leg',(-.52,-3.02,-.04),(-.45,-4.72,-.03),-.04),
('common-fibular-r','Right common fibular nerve','Nervus fibularis communis dexter','Right lateral knee to anterior/lateral leg','Terminal sciatic division winding around fibular neck before splitting into superficial and deep branches.','leg',(.57,-3.02,-.03),(.66,-4.20,-.02),.05),
('common-fibular-l','Left common fibular nerve','Nervus fibularis communis sinister','Left lateral knee to anterior/lateral leg','Terminal sciatic division winding around fibular neck before splitting into superficial and deep branches.','leg',(-.57,-3.02,-.03),(-.66,-4.20,-.02),-.05),
]
for id,nm,la,loc,desc,reg,a,b,bend in nerve_defs:
    add('nerves',entry(id,nm,la,loc,desc,reg,label=id in {'vagus-r','median-r','sciatic-r','femoral-r','tibial-r'}),obj(id,line(a,b,10,bend),.020,False,False,reg))

# VESSELS
vessel_defs=[
('ascending-aorta','Ascending aorta','Aorta ascendens','Superior heart to aortic arch','Proximal aortic segment carrying oxygenated blood from the left ventricle.','chest',(-.08,1.92,.10),(-.05,2.46,.06),.05,'artery'),
('aortic-arch','Aortic arch','Arcus aortae','Superior mediastinum','Curved aortic segment giving rise to major branches for head, neck and upper limbs.','chest',(-.05,2.46,.06),(-.38,2.55,.03),.10,'artery'),
('descending-aorta','Descending aorta','Aorta descendens','Posterior thorax and abdomen','Main arterial trunk descending through thorax and abdomen.','trunk',(-.08,2.36,-.04),(-.08,-.72,-.05),.03,'artery'),
('carotid-r','Right common carotid artery','Arteria carotis communis dextra','Right neck','Major artery supplying head and neck before dividing into internal and external carotid branches.','neck',(.10,2.48,.04),(.15,4.03,.04),.03,'artery'),
('carotid-l','Left common carotid artery','Arteria carotis communis sinistra','Left neck','Major artery supplying head and neck before dividing into internal and external carotid branches.','neck',(-.10,2.48,.04),(-.15,4.03,.04),-.03,'artery'),
('subclavian-r','Right subclavian artery','Arteria subclavia dextra','Right root of neck','Major artery continuing toward the upper limb as the axillary artery.','shoulder',(.10,2.53,.03),(.76,2.49,.03),.10,'artery'),
('subclavian-l','Left subclavian artery','Arteria subclavia sinistra','Left root of neck','Major artery continuing toward the upper limb as the axillary artery.','shoulder',(-.10,2.53,.03),(-.76,2.49,.03),-.10,'artery'),
('brachial-r','Right brachial artery','Arteria brachialis dextra','Right upper arm','Main arterial supply of upper arm before dividing into radial and ulnar arteries.','arm',(.78,2.45,.03),(1.10,1.03,.03),.03,'artery'),
('brachial-l','Left brachial artery','Arteria brachialis sinistra','Left upper arm','Main arterial supply of upper arm before dividing into radial and ulnar arteries.','arm',(-.78,2.45,.03),(-1.10,1.03,.03),-.03,'artery'),
('radial-artery-r','Right radial artery','Arteria radialis dextra','Right lateral forearm','Forearm artery contributing importantly to hand circulation.','arm',(1.10,1.03,.03),(1.27,-.06,.04),.05,'artery'),
('radial-artery-l','Left radial artery','Arteria radialis sinistra','Left lateral forearm','Forearm artery contributing importantly to hand circulation.','arm',(-1.10,1.03,.03),(-1.27,-.06,.04),-.05,'artery'),
('ulnar-artery-r','Right ulnar artery','Arteria ulnaris dextra','Right medial forearm','Forearm artery contributing importantly to superficial palmar circulation.','arm',(1.10,1.03,.02),(1.18,-.08,.02),-.03,'artery'),
('ulnar-artery-l','Left ulnar artery','Arteria ulnaris sinistra','Left medial forearm','Forearm artery contributing importantly to superficial palmar circulation.','arm',(-1.10,1.03,.02),(-1.18,-.08,.02),.03,'artery'),
('common-iliac-r','Right common iliac artery','Arteria iliaca communis dextra','Right lower abdomen','Terminal aortic branch dividing into internal and external iliac arteries.','pelvis',(-.08,-.62,-.03),(.38,-1.02,.00),.05,'artery'),
('common-iliac-l','Left common iliac artery','Arteria iliaca communis sinistra','Left lower abdomen','Terminal aortic branch dividing into internal and external iliac arteries.','pelvis',(-.08,-.62,-.03),(-.38,-1.02,.00),-.05,'artery'),
('femoral-artery-r','Right femoral artery','Arteria femoralis dextra','Right anterior thigh','Major arterial supply of lower limb after external iliac artery passes under inguinal ligament.','leg',(.38,-1.02,.03),(.48,-2.88,.03),.04,'artery'),
('femoral-artery-l','Left femoral artery','Arteria femoralis sinistra','Left anterior thigh','Major arterial supply of lower limb after external iliac artery passes under inguinal ligament.','leg',(-.38,-1.02,.03),(-.48,-2.88,.03),-.04,'artery'),
('popliteal-r','Right popliteal artery','Arteria poplitea dextra','Right posterior knee','Continuation of femoral artery behind the knee before tibial branching.','leg',(.48,-2.88,-.03),(.49,-3.28,-.04),.02,'artery'),
('popliteal-l','Left popliteal artery','Arteria poplitea sinistra','Left posterior knee','Continuation of femoral artery behind the knee before tibial branching.','leg',(-.48,-2.88,-.03),(-.49,-3.28,-.04),-.02,'artery'),
('superior-vena-cava','Superior vena cava','Vena cava superior','Right superior mediastinum','Large vein returning blood from upper body to right atrium.','chest',(.18,2.72,.00),(.18,1.86,.02),0,'vein'),
('inferior-vena-cava','Inferior vena cava','Vena cava inferior','Right posterior abdomen to heart','Large vein returning blood from lower body to right atrium.','trunk',(.15,-.78,-.03),(.15,1.75,-.02),0,'vein'),
('jugular-r','Right internal jugular vein','Vena jugularis interna dextra','Right neck','Major venous drainage channel of brain and deep face/neck.','neck',(.25,4.02,-.02),(.25,2.58,-.02),-.03,'vein'),
('jugular-l','Left internal jugular vein','Vena jugularis interna sinistra','Left neck','Major venous drainage channel of brain and deep face/neck.','neck',(-.25,4.02,-.02),(-.25,2.58,-.02),.03,'vein'),
('femoral-vein-r','Right femoral vein','Vena femoralis dextra','Right thigh','Deep vein accompanying femoral artery and returning blood from lower limb.','leg',(.56,-2.90,-.03),(.45,-1.08,-.02),-.04,'vein'),
('femoral-vein-l','Left femoral vein','Vena femoralis sinistra','Left thigh','Deep vein accompanying femoral artery and returning blood from lower limb.','leg',(-.56,-2.90,-.03),(-.45,-1.08,-.02),.04,'vein'),
]
for id,nm,la,loc,desc,reg,a,b,bend,kind in vessel_defs:
    add('vessels',entry(id,nm,la,loc,desc,reg,kind=kind,label=id in {'aortic-arch','carotid-r','femoral-artery-r','superior-vena-cava','jugular-r'}),obj(id,line(a,b,10,bend),.025,False,False,reg,kind=kind))

# TEETH — 32 permanent teeth, FDI-style ids
quad=[('central-incisor','Central incisor','Dens incisivus centralis'),('lateral-incisor','Lateral incisor','Dens incisivus lateralis'),('canine','Canine','Dens caninus'),('first-premolar','First premolar','Dens praemolaris primus'),('second-premolar','Second premolar','Dens praemolaris secundus'),('first-molar','First molar','Dens molaris primus'),('second-molar','Second molar','Dens molaris secundus'),('third-molar','Third molar','Dens molaris tertius')]
# positions: upper y 4.04, lower y 3.78; right positive x, left negative x
for arch,y,latin_arch in [('upper',4.03,'maxillaris'),('lower',3.76,'mandibularis')]:
    for side,sign,latin_side in [('right',1,'dexter'),('left',-1,'sinister')]:
        for idx,(base,nm,lat) in enumerate(quad,1):
            x=sign*(.07 + (idx-1)*.075); z=.13-.015*idx
            id=f'{arch}-{side}-{base}'
            full=f'{arch.title()} {side} {nm}'
            la=f'{lat} {latin_arch} {latin_side}'
            loc=f'{arch.title()} dental arch, {side} side'
            desc=f'Permanent {nm.lower()} in the {arch} {side} dental arch; shown for educational dental orientation.'
            rx=.035 if idx<=3 else .045; ry=.075 if arch=='upper' else .072
            add('teeth',entry(id,full,la,loc,desc,'head',arch=arch,side=side,tooth_class=base,label=idx in {1,3,6}),obj(id,ellipse(x,y,rx,ry,z,n=14),.013,True,True,'head',arch=arch,side=side))

# EYE structures — central enlarged right-eye schematic around head coordinates
# Keep within face region but structures are offset on right side for inspectability.
eye_defs=[
('cornea','Cornea','Cornea','Anterior surface of the eye','Transparent anterior tissue providing much of the eye’s refractive power.','head',(.31,4.42,.15),.16,.19),
('sclera','Sclera','Sclera','Outer fibrous coat of the eye','Tough white outer layer helping maintain globe shape and serving as muscle attachment.','head',(.31,4.42,.08),.23,.25),
('iris','Iris','Iris','Anterior uvea surrounding pupil','Pigmented diaphragm regulating pupil size and the amount of light entering the eye.','head',(.31,4.42,.17),.11,.13),
('pupil','Pupil','Pupilla','Central opening of iris','Opening in the iris through which light enters the eye.','head',(.31,4.42,.18),.045,.055),
('lens','Lens','Lens crystallina','Posterior to iris and pupil','Transparent biconvex structure that changes optical focus during accommodation.','head',(.31,4.42,.05),.10,.14),
('retina','Retina','Retina','Innermost sensory layer of posterior eye','Neural tissue containing photoreceptors and retinal circuits that begin visual processing.','head',(.31,4.42,-.09),.19,.21),
('choroid','Choroid','Choroidea','Between retina and sclera','Vascular pigmented layer supplying outer retina and absorbing scattered light.','head',(.31,4.42,-.06),.205,.225),
('macula','Macula','Macula lutea','Central posterior retina','Retinal region specialized for high-acuity central vision.','head',(.31,4.43,-.12),.045,.045),
('optic-disc','Optic disc','Discus nervi optici','Posterior retina where optic nerve exits','Site where retinal ganglion cell axons leave the eye; lacks photoreceptors.','head',(.22,4.43,-.12),.035,.045),
('optic-nerve','Optic nerve','Nervus opticus','Posterior globe to optic chiasm','Cranial nerve II carrying visual signals from retina toward the brain.','head',(.16,4.43,-.10),(-.04,4.36,-.04),0),
('ciliary-body','Ciliary body','Corpus ciliare','Ring behind iris','Uveal structure involved in aqueous production and lens accommodation through zonular fibers.','head',(.31,4.42,.00),.145,.17),
('vitreous','Vitreous body','Corpus vitreum','Posterior segment behind lens','Transparent gel filling most of the globe and supporting retinal apposition.','head',(.31,4.42,-.02),.15,.18),
('anterior-chamber','Anterior chamber','Camera anterior bulbi','Between cornea and iris','Aqueous-filled space between cornea and iris.','head',(.31,4.42,.14),.13,.16),
('conjunctiva','Conjunctiva','Tunica conjunctiva','Anterior sclera and inner eyelids','Mucous membrane covering anterior sclera and lining inner eyelid surfaces.','head',(.31,4.42,.12),.22,.24),
]
for id,nm,la,loc,desc,reg,*geom in eye_defs:
    if id=='optic-nerve':
        a,b,bend=geom; o=obj(id,line(a,b,8,bend),.025,False,False,reg)
    else:
        c,rx,ry=geom; o=obj(id,ellipse(c[0],c[1],rx,ry,c[2],n=20),.014,True,True,reg)
    add('eye',entry(id,nm,la,loc,desc,reg,label=id in {'cornea','iris','lens','retina','optic-nerve'}),o)

# PARANASAL SINUSES — paired major groups
sinus_defs=[
('frontal-sinus-r','Right frontal sinus','Sinus frontalis dexter','Right frontal bone above orbit','Air-filled paranasal sinus within frontal bone, communicating with nasal cavity.','head',(.20,4.72,.06),.13,.12),
('frontal-sinus-l','Left frontal sinus','Sinus frontalis sinister','Left frontal bone above orbit','Air-filled paranasal sinus within frontal bone, communicating with nasal cavity.','head',(-.20,4.72,.06),.13,.12),
('maxillary-sinus-r','Right maxillary sinus','Sinus maxillaris dexter','Right maxilla lateral to nasal cavity','Largest paranasal sinus occupying much of maxilla.','head',(.30,4.18,.05),.17,.21),
('maxillary-sinus-l','Left maxillary sinus','Sinus maxillaris sinister','Left maxilla lateral to nasal cavity','Largest paranasal sinus occupying much of maxilla.','head',(-.30,4.18,.05),.17,.21),
('ethmoid-air-cells-r','Right ethmoid air cells','Cellulae ethmoidales dextrae','Between right orbit and nasal cavity','Cluster of small ethmoidal air spaces between orbit and nasal cavity.','head',(.11,4.42,.04),.09,.16),
('ethmoid-air-cells-l','Left ethmoid air cells','Cellulae ethmoidales sinistrae','Between left orbit and nasal cavity','Cluster of small ethmoidal air spaces between orbit and nasal cavity.','head',(-.11,4.42,.04),.09,.16),
('sphenoid-sinus-r','Right sphenoid sinus','Sinus sphenoidalis dexter','Posterior nasal cavity within sphenoid body','Air-filled sphenoid sinus located posterior to nasal cavity.','head',(.09,4.36,-.12),.10,.11),
('sphenoid-sinus-l','Left sphenoid sinus','Sinus sphenoidalis sinister','Posterior nasal cavity within sphenoid body','Air-filled sphenoid sinus located posterior to nasal cavity.','head',(-.09,4.36,-.12),.10,.11),
]
for id,nm,la,loc,desc,reg,c,rx,ry in sinus_defs:
    add('sinuses',entry(id,nm,la,loc,desc,reg,label=True),obj(id,ellipse(c[0],c[1],rx,ry,c[2],n=18),.018,True,True,reg))

# Write catalog + model files
catalog=json.loads(CAT.read_text(encoding='utf-8'))
catalog['schema']='smd-anatomy-catalog-v2'
catalog['edition']='Phase 9 systems expansion'
catalog['disclaimer']='Educational anatomical reference. Bundled 3D geometry is simplified schematic orientation data, not a diagnostic, surgical-planning, or commercial-atlas mesh.'
for mode,rows in systems.items():
    catalog[mode]=rows
    catalog[f'{mode}_count']=len(rows)
catalog['expanded_systems']=['Joints','Ligaments','Organs','Nerves','Vessels','Teeth','Eye','Sinuses']
# retain Phase 2 foundation markers for regression history
catalog['future_layers']=['Joints','Ligaments','Nerves','Vessels','Organs','Teeth','Eye / Sinuses']
CAT.write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
for mode,objects in models.items():
    payload={'schema':'smd3d-polyline-v1','units':'normalized','system':mode,'object_count':len(objects),'objects':objects}
    (MODELS/f'{mode}-model.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print({k:len(v) for k,v in systems.items()})
