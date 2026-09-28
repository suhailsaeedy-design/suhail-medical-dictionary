(function real3dFactory(){
  'use strict';

  const MODEL_URLS = {
    skeleton: 'https://raw.githubusercontent.com/dev-christianmendes/anatomia_humana_3d/main/frontend/public/models/bodyparts3d-skeleton.glb',
    muscles: 'https://raw.githubusercontent.com/dev-christianmendes/anatomia_humana_3d/main/frontend/public/models/z-anatomy-muscles.glb'
  };
  const MODULE_URLS = {
    three: 'https://esm.sh/three@0.180.0?target=es2020',
    loader: 'https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js?target=es2020',
    controls: 'https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js?target=es2020',
    meshopt: 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/meshopt_decoder.module.js'
  };

  const clean = (value='') => String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/\b(the|bone|muscle|musculus|os)\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();

  function create(stage){
    if(!stage) return null;

    const canvas=document.createElement('canvas');
    canvas.className='anatomy-real3d-canvas';
    canvas.setAttribute('aria-label','Detailed interactive 3D anatomy model');
    stage.prepend(canvas);

    const status=document.createElement('div');
    status.className='real3d-status hidden';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    stage.append(status);

    const label=document.createElement('div');
    label.className='real3d-label hidden';
    stage.append(label);

    let libPromise=null;
    let THREE=null, GLTFLoader=null, OrbitControls=null, MeshoptDecoder=null;
    let renderer=null, scene=null, camera=null, controls=null, raycaster=null, pointer=null;
    let currentMode=null, currentRoot=null, selectedMesh=null, entries=[];
    let isolate=false, labels=true, active=false, loadingToken=0, raf=0;
    let lastPointer=null, pointerMoved=false;
    const cache=new Map();
    const roots=new Map();

    function showStatus(message,bad=false){
      status.textContent=message;
      status.classList.remove('hidden','bad');
      if(bad)status.classList.add('bad');
    }
    function hideStatus(){status.classList.add('hidden');status.classList.remove('bad');}

    async function libraries(){
      if(libPromise)return libPromise;
      libPromise=(async()=>{
        const [threeMod,loaderMod,controlsMod,meshoptMod]=await Promise.all([
          import(MODULE_URLS.three),
          import(MODULE_URLS.loader),
          import(MODULE_URLS.controls),
          import(MODULE_URLS.meshopt)
        ]);
        THREE=threeMod;
        GLTFLoader=loaderMod.GLTFLoader;
        OrbitControls=controlsMod.OrbitControls;
        MeshoptDecoder=meshoptMod.MeshoptDecoder;
        return true;
      })();
      return libPromise;
    }

    function ensureScene(){
      if(renderer)return;
      renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.05;
      renderer.setClearColor(0x000000,0);

      scene=new THREE.Scene();
      camera=new THREE.PerspectiveCamera(33,1,.01,5000);
      controls=new OrbitControls(camera,canvas);
      controls.enableDamping=true;
      controls.dampingFactor=.075;
      controls.enablePan=true;
      controls.screenSpacePanning=true;
      controls.minDistance=.05;
      controls.maxDistance=5000;
      controls.target.set(0,0,0);

      const hemi=new THREE.HemisphereLight(0xf5fbff,0x223044,2.15);
      scene.add(hemi);
      const key=new THREE.DirectionalLight(0xffffff,3.0);key.position.set(3,6,5);scene.add(key);
      const fill=new THREE.DirectionalLight(0x9fd8ff,1.45);fill.position.set(-5,2,3);scene.add(fill);
      const rim=new THREE.DirectionalLight(0xffe2ce,1.0);rim.position.set(2,1,-5);scene.add(rim);

      raycaster=new THREE.Raycaster();
      pointer=new THREE.Vector2();
      resize();
      animate();
    }

    function resize(){
      if(!renderer||!camera)return;
      const r=stage.getBoundingClientRect();
      if(r.width<10||r.height<10)return;
      const dpr=Math.min(window.devicePixelRatio||1,1.65);
      renderer.setPixelRatio(dpr);
      renderer.setSize(r.width,r.height,false);
      camera.aspect=r.width/r.height;
      camera.updateProjectionMatrix();
    }

    function meshMaterial(mode,mesh){
      const base=mode==='skeleton'?0xe8dfc6:0xb7434c;
      const source=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
      const material=new THREE.MeshStandardMaterial({
        color:source?.color?.isColor?source.color.clone():new THREE.Color(base),
        roughness:.72,
        metalness:0,
        side:THREE.DoubleSide
      });
      if(mode==='skeleton'&&(!source?.color||source.color.getHex()===0xffffff))material.color.setHex(base);
      if(mode==='muscles'&&(!source?.color||source.color.getHex()===0xffffff))material.color.setHex(base);
      mesh.userData.smdOriginalColor=material.color.getHex();
      mesh.userData.smdOriginalEmissive=material.emissive.getHex();
      return material;
    }

    function prepare(root,mode){
      root.traverse(o=>{
        if(!o.isMesh)return;
        o.frustumCulled=true;
        o.material=meshMaterial(mode,o);
        o.userData.smdSearch=[
          o.name,
          o.userData?.structureId,
          o.userData?.sourceId,
          o.parent?.name
        ].filter(Boolean).map(clean);
      });
    }

    function fit(root){
      if(!root||!camera||!controls)return;
      const box=new THREE.Box3().setFromObject(root);
      if(box.isEmpty())return;
      const size=box.getSize(new THREE.Vector3());
      const center=box.getCenter(new THREE.Vector3());
      const vFov=THREE.MathUtils.degToRad(camera.fov);
      const hFov=2*Math.atan(Math.tan(vFov/2)*Math.max(.2,camera.aspect));
      const fitH=size.y/(2*Math.tan(vFov/2));
      const fitW=size.x/(2*Math.tan(hFov/2));
      const distance=Math.max(fitH,fitW,size.z*1.35)*1.16;
      camera.near=Math.max(distance/1000,.001);
      camera.far=Math.max(distance*20,100);
      camera.position.copy(center).add(new THREE.Vector3(0,0,distance));
      controls.target.copy(center);
      controls.minDistance=Math.max(distance*.16,.02);
      controls.maxDistance=distance*6;
      camera.updateProjectionMatrix();
      controls.update();
    }

    function resetMeshStyles(){
      if(!currentRoot)return;
      currentRoot.traverse(o=>{
        if(!o.isMesh)return;
        o.visible=true;
        if(o.material?.color&&Number.isInteger(o.userData.smdOriginalColor))o.material.color.setHex(o.userData.smdOriginalColor);
        if(o.material?.emissive&&Number.isInteger(o.userData.smdOriginalEmissive))o.material.emissive.setHex(o.userData.smdOriginalEmissive);
      });
    }

    function applyIsolation(){
      if(!currentRoot)return;
      currentRoot.traverse(o=>{if(o.isMesh)o.visible=!isolate||!selectedMesh||o===selectedMesh;});
    }

    function highlight(mesh){
      if(selectedMesh&&selectedMesh!==mesh){
        const old=selectedMesh;
        if(old.material?.color&&Number.isInteger(old.userData.smdOriginalColor))old.material.color.setHex(old.userData.smdOriginalColor);
        if(old.material?.emissive&&Number.isInteger(old.userData.smdOriginalEmissive))old.material.emissive.setHex(old.userData.smdOriginalEmissive);
      }
      selectedMesh=mesh||null;
      if(selectedMesh){
        selectedMesh.material?.color?.offsetHSL?.(0,.12,.10);
        selectedMesh.material?.emissive?.setHex?.(currentMode==='skeleton'?0x244a65:0x4a1018);
      }
      applyIsolation();
    }

    function meshLabel(mesh){
      return String(
        mesh?.userData?.displayName ||
        mesh?.userData?.name ||
        mesh?.name ||
        mesh?.userData?.structureId ||
        mesh?.userData?.sourceId ||
        mesh?.parent?.name ||
        'Selected structure'
      ).replaceAll('_',' ').trim();
    }

    function entryForMesh(mesh){
      const terms=new Set((mesh?.userData?.smdSearch||[]).filter(Boolean));
      if(!terms.size)return null;
      let best=null,bestScore=0;
      for(const entry of entries||[]){
        const candidates=[entry.name,entry.latin,entry.id].map(clean).filter(Boolean);
        for(const c of candidates){
          for(const t of terms){
            let score=0;
            if(c===t)score=100;
            else if(c.length>4&&t.includes(c))score=75+c.length/100;
            else if(t.length>4&&c.includes(t))score=70+t.length/100;
            if(score>bestScore){best=entry;bestScore=score;}
          }
        }
      }
      return bestScore>=70?best:null;
    }

    function dispatchSelection(mesh){
      const entry=entryForMesh(mesh);
      window.dispatchEvent(new CustomEvent('smd21:real3dselect',{detail:{
        mode:currentMode,
        name:meshLabel(mesh),
        entryId:entry?.id||null
      }}));
    }

    function updateLabel(){
      if(!labels||!selectedMesh||!camera||!active){label.classList.add('hidden');return;}
      const box=new THREE.Box3().setFromObject(selectedMesh);
      const p=box.getCenter(new THREE.Vector3()).project(camera);
      const r=stage.getBoundingClientRect();
      if(p.z<-1||p.z>1){label.classList.add('hidden');return;}
      label.textContent=meshLabel(selectedMesh);
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

    async function load(mode,token){
      await libraries();
      if(token!==loadingToken)return null;
      ensureScene();
      if(cache.has(mode))return cache.get(mode);

      const loader=new GLTFLoader();
      loader.setCrossOrigin('anonymous');
      if(MeshoptDecoder)loader.setMeshoptDecoder(MeshoptDecoder);

      const root=await new Promise((resolve,reject)=>{
        loader.load(MODEL_URLS[mode],g=>resolve(g.scene||g.scenes?.[0]),event=>{
          if(!event.total)return;
          const pct=Math.max(1,Math.min(99,Math.round(event.loaded/event.total*100)));
          showStatus('Loading detailed '+(mode==='skeleton'?'skeleton':'muscles')+'… '+pct+'%');
        },reject);
      });
      if(!root)throw new Error('3D model did not contain a scene.');
      prepare(root,mode);
      root.visible=false;
      scene.add(root);
      roots.set(mode,root);
      cache.set(mode,root);
      return root;
    }

    async function setMode(mode,nextEntries=[]){
      currentMode=mode;
      entries=Array.isArray(nextEntries)?nextEntries:[];
      selectedMesh=null;
      label.classList.add('hidden');

      if(!MODEL_URLS[mode]){
        active=false;
        stage.classList.remove('real3d-active','real3d-loading');
        for(const root of roots.values())root.visible=false;
        hideStatus();
        return false;
      }

      const token=++loadingToken;
      stage.classList.add('real3d-loading');
      showStatus('Loading detailed '+(mode==='skeleton'?'skeleton':'muscles')+'…');
      try{
        const root=await load(mode,token);
        if(token!==loadingToken||currentMode!==mode)return false;
        for(const r of roots.values())r.visible=false;
        currentRoot=root;
        currentRoot.visible=true;
        resetMeshStyles();
        isolate=false;
        active=true;
        resize();
        fit(currentRoot);
        stage.classList.remove('real3d-loading');
        stage.classList.add('real3d-active');
        hideStatus();
        return true;
      }catch(error){
        if(token!==loadingToken)return false;
        console.warn('Detailed 3D anatomy unavailable; local fallback remains active.',error);
        active=false;
        stage.classList.remove('real3d-active','real3d-loading');
        showStatus('Detailed online 3D model unavailable — local study model is active.',true);
        setTimeout(()=>{if(!active)hideStatus();},5000);
        return false;
      }
    }

    function selectEntry(entry){
      if(!active||!currentRoot||!entry)return;
      const targets=[entry.name,entry.latin,entry.id].map(clean).filter(Boolean);
      let found=null,score=0;
      currentRoot.traverse(o=>{
        if(!o.isMesh)return;
        for(const a of o.userData.smdSearch||[]){
          for(const b of targets){
            let s=0;
            if(a===b)s=100;
            else if(a.length>4&&a.includes(b))s=80;
            else if(b.length>4&&b.includes(a))s=75;
            if(s>score){score=s;found=o;}
          }
        }
      });
      if(found&&score>=75)highlight(found);
    }

    function setLabels(value){labels=!!value;if(!labels)label.classList.add('hidden');}
    function setIsolate(value){isolate=!!value;applyIsolation();}
    function reset(){if(!active||!currentRoot)return;currentRoot.rotation.set(0,0,0);fit(currentRoot);}
    function rotateStep(delta){if(active&&currentRoot)currentRoot.rotation.y+=delta;}
    function panStep(dx,dy){
      if(!active||!camera||!controls||!currentRoot)return;
      const size=new THREE.Box3().setFromObject(currentRoot).getSize(new THREE.Vector3()).length();
      const scale=size*.025;
      camera.position.x+=dx*scale;camera.position.y+=dy*scale;
      controls.target.x+=dx*scale;controls.target.y+=dy*scale;controls.update();
    }
    function zoomStep(factor){
      if(!active||!camera||!controls)return;
      const offset=camera.position.clone().sub(controls.target).multiplyScalar(factor);
      camera.position.copy(controls.target).add(offset);controls.update();
    }
    function hide(){active=false;stage.classList.remove('real3d-active','real3d-loading');label.classList.add('hidden');hideStatus();}

    canvas.addEventListener('pointerdown',e=>{lastPointer={x:e.clientX,y:e.clientY};pointerMoved=false;});
    canvas.addEventListener('pointermove',e=>{if(lastPointer&&Math.hypot(e.clientX-lastPointer.x,e.clientY-lastPointer.y)>5)pointerMoved=true;});
    canvas.addEventListener('pointerup',e=>{
      if(!active||pointerMoved||!currentRoot||!raycaster)return;
      const r=canvas.getBoundingClientRect();
      pointer.x=((e.clientX-r.left)/r.width)*2-1;
      pointer.y=-((e.clientY-r.top)/r.height)*2+1;
      raycaster.setFromCamera(pointer,camera);
      const hits=raycaster.intersectObject(currentRoot,true).filter(h=>h.object?.isMesh&&h.object.visible);
      if(hits[0]){highlight(hits[0].object);dispatchSelection(hits[0].object);}
      lastPointer=null;
    });
    canvas.addEventListener('pointercancel',()=>{lastPointer=null;pointerMoved=false;});

    const ro=new ResizeObserver(resize);ro.observe(stage);
    window.visualViewport?.addEventListener('resize',resize);
    window.addEventListener('orientationchange',()=>setTimeout(resize,120));

    return{
      setMode,selectEntry,setLabels,setIsolate,reset,rotateStep,panStep,zoomStep,resize,hide,
      isActive:()=>active
    };
  }

  window.SMDReal3D={create};
})();
