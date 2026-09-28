(function real3dFactory(){
  'use strict';

  const ASSET_ROOT='https://raw.githubusercontent.com/dev-christianmendes/anatomia_humana_3d/main/frontend/public/models';
  const MODEL_URLS={
    skeleton:ASSET_ROOT+'/bodyparts3d-skeleton.glb',
    muscles:'https://raw.githubusercontent.com/Liyucheng1997/242_lab-human-anatomy/main/public/models/muscular.glb'
  };
  const MODEL_FALLBACK_URLS={
    muscles:'https://raw.githubusercontent.com/yogawithagnesc/yoga-app/main/assets/anatomy3d/muscles.glb'
  };
  const ATLAS_URL=ASSET_ROOT+'/fullbody/atlas.json';
  const CHUNK_URL=(index)=>ASSET_ROOT+'/fullbody/body-'+index+'.bin.gz';
  const MODULE_URLS={
    three:'https://esm.sh/three@0.180.0?target=es2020',
    loader:'https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js?target=es2020',
    controls:'https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js?target=es2020',
    draco:'https://esm.sh/three@0.180.0/examples/jsm/loaders/DRACOLoader.js?target=es2020',
    room:'https://esm.sh/three@0.180.0/examples/jsm/environments/RoomEnvironment.js?target=es2020',
    meshopt:'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/meshopt_decoder.module.js',
    pako:'https://esm.sh/pako@2.1.0?target=es2020'
  };

  const SYSTEMS={
    'SYS-ESQ':{label:'Bones',color:0xe2d9ba,description:'Bones support the body, protect organs and form the rigid framework for movement.'},
    'SYS-MUS':{label:'Muscles',color:0xa53e48,description:'Skeletal muscles contract to move and stabilize the body.'},
    'SYS-CAR':{label:'Heart',color:0xb54a52,description:'The heart pumps blood through the pulmonary and systemic circulations.'},
    'SYS-SEN':{label:'Sensory organs',color:0x86aeb8,description:'Sensory structures contribute to vision, hearing, balance and other special senses.'},
    'SYS-ART':{label:'Arteries',color:0xd63d43,description:'Arteries carry blood away from the heart to body tissues or the lungs.'},
    'SYS-VEN':{label:'Veins',color:0x3f72b5,description:'Veins return blood toward the heart from superficial and deep tissues.'},
    'SYS-NER':{label:'Nerves',color:0xe0b64e,description:'The nervous system carries sensory, motor and autonomic signals.'},
    'SYS-RES':{label:'Respiratory',color:0xbe7f91,description:'Respiratory structures conduct air and support gas exchange in the lungs.'},
    'SYS-DIG':{label:'Digestive',color:0xb98562,description:'Digestive organs process food, absorb nutrients and move waste through the tract.'},
    'SYS-URI':{label:'Urinary',color:0xb46f59,description:'Urinary organs filter blood, regulate fluid balance and carry urine.'},
    'SYS-LIN':{label:'Lymphatic',color:0x719466,description:'Lymphatic structures return tissue fluid and support immune surveillance.'},
    'SYS-END':{label:'Endocrine',color:0xc39498,description:'Endocrine organs release hormones that coordinate body functions.'},
    'SYS-REP':{label:'Reproductive',color:0xb79392,description:'Reproductive structures support gamete production, transport and reproductive function.'},
    'SYS-INT':{label:'Body surface',color:0xc1a080,description:'The body surface provides an external anatomical reference.'},
    'SYS-CON':{label:'Connective tissue',color:0x69a797,description:'Ligaments, cartilage and other connective tissues stabilize and connect anatomical structures.'}
  };

  const RX={
    joint:/joint|articul|cartilage|meniscus|labrum|symphysis|intervertebral (disc|disk)|bursa|articular/i,
    ligament:/ligament|retinaculum|aponeurosis|fascia|tendon|fibrous membrane|annulus fibrosus/i,
    tooth:/tooth|teeth|incisor|canine|premolar|molar|dental/i,
    eye:/eye|ocular|eyeball|retina|iris|cornea|lens|ciliary|lacrimal|optic|choroid|sclera|vitreous/i,
    sinus:/sinus|paranasal|maxillary sinus|frontal sinus|sphenoid sinus|ethmoid/i
  };

  const MODES={
    skeleton:{
      title:'Detailed Skeleton',
      layers:[{key:'bones',label:'Bones',type:'glb',asset:'skeleton',default:true,color:'#e2d9ba'}]
    },
    muscles:{
      title:'Detailed Muscles',
      layers:[
        {key:'muscles',label:'Muscles',type:'glb',asset:'muscles',default:true,color:'#a8323f'}
      ]
    },
    joints:{
      title:'Joints + Supporting Bones',
      layers:[
        {key:'joints',label:'Joint tissues',type:'atlas',system:'SYS-CON',default:true,color:'#27a6bd',filter:'joint'},
        {key:'bones',label:'Bones',type:'atlas',system:'SYS-ESQ',default:true,color:'#e2d9ba',opacity:.28}
      ]
    },
    ligaments:{
      title:'Ligaments + Supporting Bones',
      layers:[
        {key:'ligaments',label:'Ligaments',type:'atlas',system:'SYS-CON',default:true,color:'#d2a441',filter:'ligament'},
        {key:'bones',label:'Bones',type:'atlas',system:'SYS-ESQ',default:true,color:'#e2d9ba',opacity:.25}
      ]
    },
    organs:{
      title:'Internal Organs',
      layers:[
        {key:'heart',label:'Heart',type:'atlas',system:'SYS-CAR',default:true,color:'#b54a52'},
        {key:'respiratory',label:'Respiratory',type:'atlas',system:'SYS-RES',default:true,color:'#be7f91'},
        {key:'digestive',label:'Digestive',type:'atlas',system:'SYS-DIG',default:true,color:'#b98562'},
        {key:'urinary',label:'Urinary',type:'atlas',system:'SYS-URI',default:true,color:'#b46f59'},
        {key:'endocrine',label:'Endocrine',type:'atlas',system:'SYS-END',default:true,color:'#c39498'},
        {key:'reproductive',label:'Reproductive',type:'atlas',system:'SYS-REP',default:true,color:'#b79392'},
        {key:'lymphatic',label:'Lymphatic',type:'atlas',system:'SYS-LIN',default:false,color:'#719466'},
        {key:'sensory',label:'Sensory',type:'atlas',system:'SYS-SEN',default:false,color:'#86aeb8'}
      ]
    },
    nerves:{
      title:'Nervous System',
      layers:[
        {key:'nerves',label:'Nerves',type:'atlas',system:'SYS-NER',default:true,color:'#e0b64e'},
        {key:'bones',label:'Bones',type:'atlas',system:'SYS-ESQ',default:true,color:'#e2d9ba',opacity:.18}
      ]
    },
    vessels:{
      title:'Arteries + Veins',
      layers:[
        {key:'arteries',label:'Arteries',type:'atlas',system:'SYS-ART',default:true,color:'#d63d43'},
        {key:'veins',label:'Veins',type:'atlas',system:'SYS-VEN',default:true,color:'#3f72b5'},
        {key:'bones',label:'Bones',type:'atlas',system:'SYS-ESQ',default:false,color:'#e2d9ba',opacity:.18}
      ]
    },
    teeth:{
      title:'Detailed Teeth',
      layers:[{key:'teeth',label:'Teeth',type:'atlas',system:'SYS-ESQ',default:true,color:'#efe6ca',filter:'tooth'}]
    },
    eye:{
      title:'Detailed Eye',
      layers:[
        {key:'eye',label:'Eye structures',type:'atlas',system:'SYS-SEN',default:true,color:'#5fb6bf',filter:'eye'},
        {key:'nerves',label:'Nerves',type:'atlas',system:'SYS-NER',default:false,color:'#e0b64e',filter:'eye'}
      ]
    },
    sinuses:{
      title:'Paranasal Sinuses',
      layers:[
        {key:'sinuses',label:'Sinuses',type:'atlas',system:'SYS-RES',default:true,color:'#8d6bc1',filter:'sinus'},
        {key:'bones',label:'Skull',type:'atlas',system:'SYS-ESQ',default:true,color:'#e2d9ba',opacity:.2,filter:'sinus'}
      ]
    }
  };

  const SIDE_LABELS={l:'Left',r:'Right',left:'Left',right:'Right',midline:'Midline','-':'Midline'};
  const REGION_LABELS={
    'REG-HEAD':'Head','REG-NECK':'Neck','REG-TRUNK':'Trunk','REG-UPPER-LIMB':'Upper limb',
    'REG-LOWER-LIMB':'Lower limb','REG-THORAX':'Thorax','REG-ABDOMEN':'Abdomen','REG-PELVIS':'Pelvis'
  };

  const clean=(value='')=>String(value).toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/\b(the|bone|muscle|musculus|os)\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ').trim();

  const hash01=(value='')=>{
    let h=2166136261;
    for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return((h>>>0)%1000)/1000;
  };

  function create(stage){
    if(!stage)return null;

    const canvas=document.createElement('canvas');
    canvas.className='anatomy-real3d-canvas';
    canvas.setAttribute('aria-label','Detailed interactive human anatomy atlas');
    stage.prepend(canvas);

    const status=document.createElement('div');
    status.className='real3d-status hidden';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    stage.append(status);

    const label=document.createElement('div');
    label.className='real3d-label hidden';
    stage.append(label);

    const popup=document.createElement('div');
    popup.className='real3d-popup hidden';
    popup.innerHTML='<button type="button" class="real3d-popup-close" aria-label="Close structure information">×</button><b class="real3d-popup-name"></b><span class="real3d-popup-location"></span><p class="real3d-popup-description"></p>';
    stage.append(popup);

    const layerBar=document.createElement('div');
    layerBar.className='real3d-layers hidden';
    layerBar.setAttribute('aria-label','Anatomy layers');
    stage.append(layerBar);

    const help=document.createElement('div');
    help.className='real3d-help';
    help.textContent='Tap structure · 1 finger rotate · 2 fingers zoom / pan';
    stage.append(help);

    let libPromise=null,atlasPromise=null,pakoPromise=null;
    let THREE=null,GLTFLoader=null,OrbitControls=null,DRACOLoader=null,RoomEnvironment=null,MeshoptDecoder=null;
    let renderer=null,scene=null,camera=null,controls=null,raycaster=null,pointer=null;
    let currentMode=null,currentAssembly=null,selectedMesh=null,entries=[];
    let labels=true,isolate=false,active=false,loadingToken=0,raf=0;
    let lastPointer=null,pointerMoved=false;
    const glbCache=new Map();
    const atlasGroupCache=new Map();
    const geometryDisposables=new Set();
    const materialDisposables=new Set();
    let selectableMeshes=[];
    let layerStates=new Map();

    const modeConfig=()=>MODES[currentMode]||null;

    function showStatus(message,bad=false){
      status.textContent=message;
      status.classList.remove('hidden','bad');
      if(bad)status.classList.add('bad');
    }
    function hideStatus(){status.classList.add('hidden');status.classList.remove('bad');}

    async function libraries(){
      if(libPromise)return libPromise;
      libPromise=(async()=>{
        const [threeMod,loaderMod,controlsMod,dracoMod,roomMod,meshoptMod]=await Promise.all([
          import(MODULE_URLS.three),
          import(MODULE_URLS.loader),
          import(MODULE_URLS.controls),
          import(MODULE_URLS.draco),
          import(MODULE_URLS.room),
          import(MODULE_URLS.meshopt)
        ]);
        THREE=threeMod;
        GLTFLoader=loaderMod.GLTFLoader;
        OrbitControls=controlsMod.OrbitControls;
        DRACOLoader=dracoMod.DRACOLoader;
        RoomEnvironment=roomMod.RoomEnvironment;
        MeshoptDecoder=meshoptMod.MeshoptDecoder;
        return true;
      })();
      return libPromise;
    }

    async function atlasMeta(){
      if(atlasPromise)return atlasPromise;
      atlasPromise=fetch(ATLAS_URL,{cache:'force-cache'}).then(r=>{
        if(!r.ok)throw new Error('Full anatomy atlas metadata could not be loaded.');
        return r.json();
      });
      return atlasPromise;
    }

    async function gunzip(buffer){
      const bytes=new Uint8Array(buffer);
      if(bytes[0]!==0x1f||bytes[1]!==0x8b)return buffer;
      if(typeof DecompressionStream!=='undefined'){
        return await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      }
      if(!pakoPromise)pakoPromise=import(MODULE_URLS.pako);
      const pako=await pakoPromise;
      const out=pako.ungzip(bytes);
      return out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength);
    }

    function ensureScene(){
      if(renderer)return;
      renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.16;
      renderer.setClearColor(0x000000,0);

      scene=new THREE.Scene();
      if(RoomEnvironment){
        const pmrem=new THREE.PMREMGenerator(renderer);
        scene.environment=pmrem.fromScene(new RoomEnvironment(),.035).texture;
        pmrem.dispose();
      }
      camera=new THREE.PerspectiveCamera(32,1,.01,100000);
      controls=new OrbitControls(camera,canvas);
      controls.enableDamping=true;
      controls.dampingFactor=.08;
      controls.enablePan=true;
      controls.enableZoom=true;
      controls.enableRotate=true;
      controls.screenSpacePanning=true;
      controls.rotateSpeed=.68;
      controls.zoomSpeed=.88;
      controls.panSpeed=.82;
      controls.minDistance=.05;
      controls.maxDistance=100000;
      if(THREE.TOUCH){
        controls.touches.ONE=THREE.TOUCH.ROTATE;
        controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
      }

      scene.add(new THREE.HemisphereLight(0xf8f6f2,0x4a2a29,.82));
      scene.add(new THREE.AmbientLight(0xffffff,.22));
      const key=new THREE.DirectionalLight(0xfff1df,1.48);key.position.set(-4,8,7);scene.add(key);
      const fill=new THREE.DirectionalLight(0xd7e7f3,.52);fill.position.set(5,3,4);scene.add(fill);
      const rim=new THREE.DirectionalLight(0xffb29d,.42);rim.position.set(2,5,-7);scene.add(rim);
      const front=new THREE.DirectionalLight(0xffffff,.46);front.position.set(0,3,9);scene.add(front);

      raycaster=new THREE.Raycaster();
      pointer=new THREE.Vector2();
      resize();
      animate();
    }

    function resize(){
      if(!renderer||!camera)return;
      const r=stage.getBoundingClientRect();
      if(r.width<10||r.height<10)return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,matchMedia('(max-width:700px)').matches?1.45:1.7));
      renderer.setSize(r.width,r.height,false);
      camera.aspect=r.width/r.height;
      camera.updateProjectionMatrix();
    }

    function visibleBox(root){
      const box=new THREE.Box3();
      const temp=new THREE.Box3();
      let any=false;
      root.updateMatrixWorld(true);
      root.traverse(o=>{
        if(!o.isMesh||!o.visible||!o.geometry)return;
        if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
        if(!o.geometry.boundingBox)return;
        temp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        box.union(temp);any=true;
      });
      return any?box:null;
    }

    function centerAndFit(root){
      if(!root||!camera||!controls)return;
      root.position.set(0,0,0);
      root.rotation.set(0,0,0);
      root.updateMatrixWorld(true);
      let box=visibleBox(root);
      if(!box||box.isEmpty())return;

      const initialCenter=box.getCenter(new THREE.Vector3());
      root.position.sub(initialCenter);
      root.updateMatrixWorld(true);
      box=visibleBox(root);
      if(!box||box.isEmpty())return;

      const size=box.getSize(new THREE.Vector3());
      const centered=box.getCenter(new THREE.Vector3());
      const visualWidth=size.x;
      const visualDepth=size.z;

      const vFov=THREE.MathUtils.degToRad(camera.fov);
      const hFov=2*Math.atan(Math.tan(vFov/2)*Math.max(.25,camera.aspect));
      const fitH=size.y/(2*Math.tan(vFov/2));
      const fitW=visualWidth/(2*Math.tan(hFov/2));
      const mobile=matchMedia('(max-width:700px)').matches;
      const margin=mobile?1.025:1.08;
      const distance=Math.max(fitH,fitW,visualDepth*.72)*margin;

      camera.near=Math.max(distance/5000,.001);
      camera.far=Math.max(distance*32,100);
      camera.position.set(centered.x,centered.y,distance);
      controls.target.copy(centered);
      controls.minDistance=Math.max(distance*.11,.02);
      controls.maxDistance=distance*7;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      controls.update();
    }

    function makeMaterial(color,opacity=1,roughness=.72){
      const m=new THREE.MeshStandardMaterial({
        color:new THREE.Color(color),
        roughness,
        metalness:0,
        side:THREE.DoubleSide,
        transparent:opacity<.999,
        opacity,
        depthWrite:opacity>.45
      });
      materialDisposables.add(m);
      return m;
    }

    let muscleFiberTexture=null;
    function getMuscleFiberTexture(){
      if(muscleFiberTexture||!THREE)return muscleFiberTexture;
      const c=document.createElement('canvas');c.width=128;c.height=128;
      const ctx=c.getContext('2d');
      const img=ctx.createImageData(128,128);
      for(let y=0;y<128;y++){
        for(let x=0;x<128;x++){
          const wave=Math.sin((y*.92)+(Math.sin(x*.12)*2.6))*16;
          const fine=Math.sin((y*2.9)+(x*.04))*6;
          const noise=((x*17+y*31)%19)-9;
          const v=Math.max(0,Math.min(255,128+wave+fine+noise));
          const i=(y*128+x)*4;
          img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;
        }
      }
      ctx.putImageData(img,0,0);
      muscleFiberTexture=new THREE.CanvasTexture(c);
      muscleFiberTexture.wrapS=muscleFiberTexture.wrapT=THREE.RepeatWrapping;
      muscleFiberTexture.repeat.set(7,24);
      muscleFiberTexture.colorSpace=THREE.NoColorSpace;
      muscleFiberTexture.needsUpdate=true;
      return muscleFiberTexture;
    }

    function prepareGlb(root,asset){
      root.userData.smdBaseRotationX=0;
      root.traverse(o=>{
        if(!o.isMesh)return;
        const rawName=o.userData?.concept||o.userData?.structureId||o.name||'';
        const seed=hash01(rawName);
        const lower=String(rawName).toLowerCase();
        const connective=/tendon|ligament|retinaculum|aponeuros|fascia|membrane|raphe|linea alba/.test(lower);
        const original=Array.isArray(o.material)?o.material[0]:o.material;
        let material;
        if(asset==='skeleton'){
          material=makeMaterial(0xe8dfc5,1,.76);
        }else if(connective){
          material=new THREE.MeshStandardMaterial({
            color:new THREE.Color().setHSL(.105,.22,.80+seed*.045),
            roughness:.46,
            metalness:0,
            side:THREE.DoubleSide,
            flatShading:false
          });
          materialDisposables.add(material);
        }else{
          const sourceColor=original?.color?.isColor?original.color.clone():new THREE.Color(0xb14a42);
          const hsl={h:0,s:0,l:0};sourceColor.getHSL(hsl);
          const color=new THREE.Color().setHSL(
            .008+seed*.012,
            Math.max(.48,Math.min(.72,hsl.s+.08)),
            Math.max(.25,Math.min(.40,hsl.l+(seed-.5)*.055))
          );
          material=new THREE.MeshStandardMaterial({
            color,
            roughness:.49,
            metalness:0,
            side:THREE.DoubleSide,
            flatShading:false
          });
          material.emissive=new THREE.Color(0x100102);
          material.emissiveIntensity=.018;
          if(o.geometry?.attributes?.uv){
            material.bumpMap=getMuscleFiberTexture();
            material.bumpScale=.012;
          }
          materialDisposables.add(material);
        }
        o.material=material;
        o.castShadow=false;
        o.receiveShadow=false;
        o.userData.smdBaseMaterial=material;
        o.userData.smdSystem=asset==='skeleton'?'SYS-ESQ':'SYS-MUS';
        o.userData.smdName=o.userData?.concept||o.userData?.displayName||o.name||o.userData?.structureId||'Anatomical structure';
        o.userData.smdSearch=[o.userData.smdName,o.userData?.structureId,o.userData?.sourceId,o.parent?.name].filter(Boolean).map(clean);
        if(o.geometry){
          o.geometry.computeBoundingBox();
          o.geometry.computeBoundingSphere();
          if(!o.geometry.attributes.normal)o.geometry.computeVertexNormals();
        }
      });
    }

    async function loadGlb(asset){
      if(glbCache.has(asset))return glbCache.get(asset);
      await libraries();ensureScene();
      const loader=new GLTFLoader();
      loader.setCrossOrigin('anonymous');
      if(MeshoptDecoder)loader.setMeshoptDecoder(MeshoptDecoder);
      if(DRACOLoader){
        const draco=new DRACOLoader();
        draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/gltf/');
        loader.setDRACOLoader(draco);
      }
      const loadOne=(url)=>new Promise((resolve,reject)=>{
        loader.load(url,g=>resolve(g.scene||g.scenes?.[0]),undefined,reject);
      });
      let root;
      let baseRotationX=0;
      try{
        root=await loadOne(MODEL_URLS[asset]);
      }catch(error){
        const fallback=MODEL_FALLBACK_URLS[asset];
        if(!fallback)throw error;
        console.warn('Primary '+asset+' mesh failed; using fallback.',error);
        root=await loadOne(fallback);
        if(asset==='muscles')baseRotationX=-Math.PI/2;
      }
      if(!root)throw new Error('Detailed '+asset+' model did not contain a scene.');
      prepareGlb(root,asset);
      root.userData.smdBaseRotationX=baseRotationX;
      glbCache.set(asset,root);
      return root;
    }

    function atlasMaterial(system){
      const meta=SYSTEMS[system]||{color:0x9ba8ad};
      return makeMaterial(meta.color,1,system==='SYS-MUS'?.74:.66);
    }

    function muscleMaterial(name){
      const seed=hash01(name||'muscle');
      const color=new THREE.Color().setHSL((.985+seed*.018)%1,.70+seed*.10,.29+seed*.11);
      const m=makeMaterial(color,1,.60);
      m.emissive=new THREE.Color(0x210305);
      m.emissiveIntensity=.055;
      return m;
    }

    function eyeMaterial(name){
      const n=String(name||'').toLowerCase();
      let color=0xd7b7a9,opacity=1,roughness=.42,emissive=null;
      if(/sclera/.test(n)){color=0xf0eee4;roughness=.30;}
      else if(/cornea/.test(n)){color=0xc7eff7;opacity=.24;roughness=.08;}
      else if(/iris/.test(n)){color=0x6a7f5b;roughness=.34;}
      else if(/pupil/.test(n)){color=0x090b0c;roughness=.24;}
      else if(/lens/.test(n)){color=0xeaf7ef;opacity=.30;roughness=.10;}
      else if(/vitreous|aqueous/.test(n)){color=0xcfeaf0;opacity=.18;roughness=.10;}
      else if(/retina/.test(n)){color=0xca6d62;roughness=.46;}
      else if(/choroid/.test(n)){color=0x542b35;roughness=.52;}
      else if(/optic/.test(n)){color=0xe6c75b;roughness=.55;}
      else if(/lacrimal/.test(n)){color=0xd991a4;roughness=.50;}
      else if(/ciliary/.test(n)){color=0x8d6656;roughness=.48;}
      const m=makeMaterial(color,opacity,roughness);
      if(opacity<.5){m.depthWrite=false;m.transparent=true;}
      if(emissive){m.emissive=new THREE.Color(emissive);m.emissiveIntensity=.08;}
      return m;
    }

    function atlasPartMaterial(system,name){
      if(system==='SYS-MUS')return muscleMaterial(name);
      if(system==='SYS-SEN'&&RX.eye.test(String(name||'')))return eyeMaterial(name);
      return null;
    }

    async function loadAtlasSystem(system){
      if(atlasGroupCache.has(system))return atlasGroupCache.get(system);
      await libraries();ensureScene();
      const atlas=await atlasMeta();
      const ci=atlas.systems.findIndex(s=>s.code===system);
      if(ci<0)throw new Error('Anatomy system '+system+' is not available.');
      const chunk=atlas.chunks[ci];
      const response=await fetch(CHUNK_URL(ci),{cache:'force-cache'});
      if(!response.ok)throw new Error('Detailed anatomy layer '+(SYSTEMS[system]?.label||system)+' could not be loaded.');
      let buffer=await response.arrayBuffer();
      buffer=await gunzip(buffer);
      if(chunk?.bytes&&buffer.byteLength!==chunk.bytes)throw new Error('Anatomy layer '+(SYSTEMS[system]?.label||system)+' was incomplete.');

      const group=new THREE.Group();
      group.name='atlas-'+system;
      group.userData.smdSystem=system;
      group.userData.smdMaterial=atlasMaterial(system);
      const parts=atlas.parts.filter(p=>p.chunk===ci);
      for(const part of parts){
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buffer,part.positions,part.vertexCount*3),3));
        geometry.setAttribute('normal',new THREE.BufferAttribute(new Int16Array(buffer,part.normals,part.vertexCount*3),3,true));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,part.indices,part.indexCount),1));
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        geometryDisposables.add(geometry);
        const partMaterial=atlasPartMaterial(system,part.name||part.id)||group.userData.smdMaterial;
        const mesh=new THREE.Mesh(geometry,partMaterial);
        mesh.name=part.name||part.id;
        mesh.userData.smdBaseMaterial=partMaterial;
        mesh.userData.smdSystem=system;
        mesh.userData.smdName=part.name||part.id;
        mesh.userData.smdPart=part;
        mesh.userData.smdSearch=[part.name,part.id,part.sourceId,part.conceptId].filter(Boolean).map(clean);
        group.add(mesh);
      }
      atlasGroupCache.set(system,group);
      return group;
    }

    function matchesFilter(mesh,filterKey){
      if(!filterKey)return true;
      const rx=RX[filterKey];
      if(!rx)return true;
      const text=[mesh.userData?.smdName,mesh.userData?.smdPart?.name,mesh.name].filter(Boolean).join(' ');
      return rx.test(text);
    }

    function styleGroup(group,spec){
      const opacity=spec.opacity??1;
      const seen=new Set();
      group.traverse(o=>{
        if(!o.isMesh)return;
        let m=o.userData.smdBaseMaterial||o.material;
        if(!seen.has(m)){
          seen.add(m);
          if(spec.color&&spec.type!=='glb'&&spec.system!=='SYS-MUS'&&spec.system!=='SYS-SEN')m.color.set(spec.color);
          m.opacity=opacity;
          m.transparent=opacity<.999;
          m.depthWrite=opacity>.45;
          m.needsUpdate=true;
        }
      });
    }

    function layerMeshVisibility(spec,enabled){
      const root=spec.root;
      if(!root)return;
      root.visible=true;
      root.traverse(o=>{
        if(!o.isMesh)return;
        const filterOk=matchesFilter(o,spec.filter);
        o.userData.smdLayerKey=spec.key;
        o.userData.smdLayerVisible=!!enabled&&filterOk;
        o.visible=o.userData.smdLayerVisible&&(!isolate||!selectedMesh||o===selectedMesh);
      });
    }

    function buildLayerBar(layerSpecs){
      layerBar.innerHTML='';
      layerStates=new Map();
      for(const spec of layerSpecs){
        layerStates.set(spec.key,!!spec.default);
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='real3d-layer-btn'+(spec.default?' active':'');
        btn.dataset.layerKey=spec.key;
        btn.setAttribute('aria-pressed',String(!!spec.default));
        btn.innerHTML='<span class="real3d-layer-dot" style="--layer-color:'+(spec.color||'#9cc')+'"></span>'+spec.label;
        btn.addEventListener('click',()=>{
          const next=!layerStates.get(spec.key);
          layerStates.set(spec.key,next);
          btn.classList.toggle('active',next);
          btn.setAttribute('aria-pressed',String(next));
          layerMeshVisibility(spec,next);
          if(selectedMesh&&!selectedMesh.visible)clearSelection();
          setTimeout(()=>centerAndFit(currentAssembly),0);
        });
        layerBar.append(btn);
      }
      layerBar.classList.toggle('hidden',layerSpecs.length<=1);
    }

    function restoreMesh(mesh){
      if(!mesh)return;
      if(mesh.userData?.smdBaseMaterial)mesh.material=mesh.userData.smdBaseMaterial;
    }

    const selectedMaterial=()=>{
      const m=makeMaterial(0x20e878,1,.38);
      m.emissive=new THREE.Color(0x087a3f);
      m.emissiveIntensity=.82;
      return m;
    };

    function clearSelection(){
      restoreMesh(selectedMesh);
      selectedMesh=null;
      label.classList.add('hidden');
      popup.classList.add('hidden');
      applyIsolation();
    }

    function highlight(mesh){
      if(selectedMesh!==mesh)restoreMesh(selectedMesh);
      selectedMesh=mesh||null;
      if(selectedMesh){
        if(!selectedMesh.userData.smdSelectedMaterial)selectedMesh.userData.smdSelectedMaterial=selectedMaterial();
        selectedMesh.material=selectedMesh.userData.smdSelectedMaterial;
      }
      applyIsolation();
    }

    function applyIsolation(){
      for(const mesh of selectableMeshes){
        const base=mesh.userData.smdLayerVisible!==false;
        mesh.visible=base&&(!isolate||!selectedMesh||mesh===selectedMesh);
      }
    }

    function entryForMesh(mesh){
      const terms=new Set((mesh?.userData?.smdSearch||[]).filter(Boolean));
      if(!terms.size)return null;

      const isAtlas=Boolean(mesh?.userData?.smdPart);
      let best=null,bestScore=0;

      for(const entry of entries||[]){
        const candidates=[entry.name,entry.latin,entry.id].map(clean).filter(Boolean);
        for(const a of candidates){
          for(const b of terms){
            let score=0;
            if(a===b)score=100;
            else if(!isAtlas&&a.length>5&&b.includes(a))score=90;
            else if(!isAtlas&&b.length>5&&a.includes(b))score=86;
            if(score>bestScore){best=entry;bestScore=score;}
          }
        }
      }
      return bestScore>=95?best:null;
    }

    function meshName(mesh){
      return String(mesh?.userData?.smdName||mesh?.name||'Selected structure').replace(/[._]+/g,' ').replace(/\s+/g,' ').trim();
    }

    function meshInfo(mesh){
      const entry=entryForMesh(mesh);
      const system=mesh?.userData?.smdSystem;
      const sys=SYSTEMS[system]||{};
      const side=SIDE_LABELS[String(mesh?.userData?.side||'').toLowerCase()]||'';
      const region=REGION_LABELS[mesh?.userData?.region]||entry?.region||'';
      const name=entry?.name||meshName(mesh);
      const location=entry?.location||[side,region].filter(Boolean).join(' ')||sys.label||'Human anatomy';
      const description=entry?.description||(
        name+' is shown as a selectable structure in the detailed human anatomy model. '+
        (sys.description||'Its position is displayed in relation to surrounding anatomical structures.')
      );
      return{entry,name,location,description};
    }

    function showPopup(mesh,clientX,clientY){
      const info=meshInfo(mesh);
      popup.querySelector('.real3d-popup-name').textContent=info.name;
      popup.querySelector('.real3d-popup-location').textContent=info.location;
      popup.querySelector('.real3d-popup-description').textContent=info.description;
      const r=stage.getBoundingClientRect();
      const px=clientX==null?r.left+r.width/2:clientX;
      const py=clientY==null?r.top+r.height*.4:clientY;
      let x=Math.max(12,Math.min(r.width-12,px-r.left));
      let y=Math.max(12,Math.min(r.height-12,py-r.top));
      popup.style.left=x+'px';popup.style.top=y+'px';
      popup.classList.remove('hidden');
      requestAnimationFrame(()=>{
        const p=popup.getBoundingClientRect();
        let dx=0,dy=0;
        if(p.right>r.right-8)dx=(r.right-8)-p.right;
        if(p.left<r.left+8)dx=(r.left+8)-p.left;
        if(p.bottom>r.bottom-8)dy=(r.bottom-8)-p.bottom;
        if(p.top<r.top+8)dy=(r.top+8)-p.top;
        if(dx||dy){popup.style.left=(x+dx)+'px';popup.style.top=(y+dy)+'px';}
      });
      return info;
    }

    function dispatchSelection(mesh,info){
      window.dispatchEvent(new CustomEvent('smd21:real3dselect',{detail:{
        mode:currentMode,
        name:info.name,
        location:info.location,
        description:info.description,
        entryId:info.entry?.id||null
      }}));
    }

    function updateLabel(){
      if(!labels||!selectedMesh||!selectedMesh.visible||!active||!popup.classList.contains('hidden')){label.classList.add('hidden');return;}
      const box=new THREE.Box3().setFromObject(selectedMesh);
      const p=box.getCenter(new THREE.Vector3()).project(camera);
      const r=stage.getBoundingClientRect();
      if(p.z<-1||p.z>1){label.classList.add('hidden');return;}
      label.textContent=meshName(selectedMesh);
      label.style.left=((p.x*.5+.5)*r.width)+'px';
      label.style.top=((-p.y*.5+.5)*r.height)+'px';
      label.classList.remove('hidden');
    }

    function animate(){
      if(!renderer)return;
      cancelAnimationFrame(raf);
      const tick=()=>{
        raf=requestAnimationFrame(tick);
        controls?.update();
        updateLabel();
        renderer.render(scene,camera);
      };
      tick();
    }

    async function layerRoot(spec){
      const root=spec.type==='glb'?await loadGlb(spec.asset):await loadAtlasSystem(spec.system);
      return root;
    }

    async function setMode(mode,nextEntries=[]){
      currentMode=mode;
      stage.dataset.real3dMode=mode;
      entries=Array.isArray(nextEntries)?nextEntries:[];
      labels=labels!==false;
      selectedMesh=null;
      popup.classList.add('hidden');
      label.classList.add('hidden');

      const cfg=MODES[mode];
      if(!cfg){
        active=false;
        stage.classList.remove('real3d-active','real3d-loading');
        layerBar.classList.add('hidden');
        hideStatus();
        return false;
      }

      const token=++loadingToken;
      stage.classList.add('real3d-loading');
      showStatus('Loading '+cfg.title+'…');
      try{
        await libraries();ensureScene();
        const specs=cfg.layers.map(x=>({...x}));
        const roots=await Promise.all(specs.map(async spec=>{
          const root=await layerRoot(spec);
          spec.root=root;
          return root;
        }));
        if(token!==loadingToken||currentMode!==mode)return false;

        if(currentAssembly)scene.remove(currentAssembly);
        currentAssembly=new THREE.Group();
        currentAssembly.name='mode-'+mode;
        scene.add(currentAssembly);
        selectableMeshes=[];

        roots.forEach((root,i)=>{
          const spec=specs[i];
          if(root.parent)root.parent.remove(root);
          root.position.set(0,0,0);
          root.rotation.set(root.userData.smdBaseRotationX||0,0,0);
          currentAssembly.add(root);
          styleGroup(root,spec);
          root.traverse(o=>{if(o.isMesh)selectableMeshes.push(o);});
        });

        buildLayerBar(specs);
        for(const spec of specs)layerMeshVisibility(spec,!!spec.default);
        currentAssembly.updateMatrixWorld(true);
        active=true;
        resize();
        centerAndFit(currentAssembly);
        requestAnimationFrame(()=>{resize();centerAndFit(currentAssembly);});
        setTimeout(()=>{if(active&&currentAssembly)centerAndFit(currentAssembly);},140);
        setTimeout(()=>{if(active&&currentAssembly)centerAndFit(currentAssembly);},420);
        stage.classList.remove('real3d-loading');
        stage.classList.add('real3d-active');
        hideStatus();
        return true;
      }catch(error){
        if(token!==loadingToken)return false;
        console.warn('Detailed anatomy atlas unavailable; local fallback remains active.',error);
        active=false;
        stage.classList.remove('real3d-active','real3d-loading');
        layerBar.classList.add('hidden');
        showStatus('Detailed online anatomy unavailable — local study model is active.',true);
        setTimeout(()=>{if(!active)hideStatus();},5000);
        return false;
      }
    }

    function selectEntry(entry){
      if(!active||!entry)return;
      const targets=[entry.name,entry.latin,entry.id].map(clean).filter(Boolean);
      let found=null,score=0;
      for(const mesh of selectableMeshes){
        if(!mesh.visible)continue;
        for(const a of mesh.userData.smdSearch||[]){
          for(const b of targets){
            let s=0;
            if(a===b)s=100;
            else if(a.length>4&&a.includes(b))s=82;
            else if(b.length>4&&b.includes(a))s=76;
            if(s>score){score=s;found=mesh;}
          }
        }
      }
      if(found&&score>=75){highlight(found);showPopup(found);}
    }

    function setLabels(value){labels=!!value;if(!labels)label.classList.add('hidden');}
    function setIsolate(value){isolate=!!value;applyIsolation();}
    function reset(){
      if(!active||!currentAssembly)return;
      currentAssembly.rotation.set(0,0,0);
      currentAssembly.position.set(0,0,0);
      popup.classList.add('hidden');
      label.classList.add('hidden');
      centerAndFit(currentAssembly);
    }
    function rotateStep(delta){if(active&&currentAssembly)currentAssembly.rotation.y+=delta;}
    function panStep(dx,dy){
      if(!active||!camera||!controls||!currentAssembly)return;
      const box=visibleBox(currentAssembly);if(!box)return;
      const scale=box.getSize(new THREE.Vector3()).length()*.025;
      camera.position.x+=dx*scale;camera.position.y+=dy*scale;
      controls.target.x+=dx*scale;controls.target.y+=dy*scale;
      controls.update();
    }
    function zoomStep(factor){
      if(!active||!camera||!controls)return;
      const offset=camera.position.clone().sub(controls.target).multiplyScalar(factor);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    }
    function hide(){
      active=false;
      stage.classList.remove('real3d-active','real3d-loading');
      layerBar.classList.add('hidden');
      label.classList.add('hidden');
      popup.classList.add('hidden');
      hideStatus();
    }

    canvas.addEventListener('pointerdown',e=>{lastPointer={x:e.clientX,y:e.clientY};pointerMoved=false;});
    canvas.addEventListener('pointermove',e=>{
      if(lastPointer&&Math.hypot(e.clientX-lastPointer.x,e.clientY-lastPointer.y)>7)pointerMoved=true;
    });
    canvas.addEventListener('pointerup',e=>{
      if(!active||pointerMoved||!raycaster)return;
      const r=canvas.getBoundingClientRect();
      pointer.x=((e.clientX-r.left)/r.width)*2-1;
      pointer.y=-((e.clientY-r.top)/r.height)*2+1;
      raycaster.setFromCamera(pointer,camera);
      const candidates=selectableMeshes.filter(m=>m.visible);
      const hits=raycaster.intersectObjects(candidates,false);
      if(hits[0]){
        highlight(hits[0].object);
        const info=showPopup(hits[0].object,e.clientX,e.clientY);
        dispatchSelection(hits[0].object,info);
      }else{
        popup.classList.add('hidden');
      }
      lastPointer=null;
    });
    canvas.addEventListener('dblclick',e=>{e.preventDefault();reset();});
    canvas.addEventListener('pointercancel',()=>{lastPointer=null;pointerMoved=false;});
    popup.querySelector('.real3d-popup-close').addEventListener('click',e=>{e.stopPropagation();popup.classList.add('hidden');});

    const ro=new ResizeObserver(()=>{resize();if(active&&currentAssembly)centerAndFit(currentAssembly);});
    ro.observe(stage);
    window.visualViewport?.addEventListener('resize',()=>{resize();if(active&&currentAssembly)centerAndFit(currentAssembly);});
    window.addEventListener('orientationchange',()=>setTimeout(()=>{resize();if(active&&currentAssembly)centerAndFit(currentAssembly);},140));

    return{
      setMode,selectEntry,setLabels,setIsolate,reset,rotateStep,panStep,zoomStep,resize,hide,
      isActive:()=>active,
      supportsMode:(mode)=>Boolean(MODES[mode])
    };
  }

  window.SMDReal3D={create};
})();
