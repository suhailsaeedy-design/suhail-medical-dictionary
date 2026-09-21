(() => {
  'use strict';
  if (!window.SMD21Auth || !SMD21Auth.guard()) return;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const canvas = $('#anatomyCanvas');
  const stage = $('#canvasStage');
  const ctx = canvas.getContext('2d', { alpha: true });

  const MODE_META = {
    skeleton: { title:'3D Skeleton', eyebrow:'Skeleton', singular:'bone', model:'assets/models/skeleton-model.json', centerY:0, scale:1, base:false },
    muscles: { title:'3D Muscles', eyebrow:'Muscles', singular:'muscle', model:'assets/models/muscles-model.json', centerY:0, scale:1, base:true },
    joints: { title:'3D Joints', eyebrow:'Joints', singular:'joint', model:'assets/models/joints-model.json', centerY:0, scale:1, base:true },
    ligaments: { title:'3D Ligaments', eyebrow:'Ligaments', singular:'ligament', model:'assets/models/ligaments-model.json', centerY:0, scale:1, base:true },
    organs: { title:'3D Organs', eyebrow:'Organs', singular:'organ', model:'assets/models/organs-model.json', centerY:0.7, scale:1.18, base:true },
    nerves: { title:'3D Nerves', eyebrow:'Nerves', singular:'nerve', model:'assets/models/nerves-model.json', centerY:0, scale:1, base:true },
    vessels: { title:'3D Vessels', eyebrow:'Vessels', singular:'vessel', model:'assets/models/vessels-model.json', centerY:0, scale:1, base:true },
    teeth: { title:'Permanent Teeth', eyebrow:'Teeth', singular:'tooth', model:'assets/models/teeth-model.json', centerY:3.90, scale:3.25, base:false },
    eye: { title:'Eye Anatomy', eyebrow:'Eye', singular:'eye structure', model:'assets/models/eye-model.json', centerY:4.42, scale:3.05, base:false },
    sinuses: { title:'Paranasal Sinuses', eyebrow:'Sinuses', singular:'sinus structure', model:'assets/models/sinuses-model.json', centerY:4.42, scale:3.0, base:false }
  };
  const MODES = Object.keys(MODE_META);
  const skeletonLabels = new Set(['frontal','sternum','clavicle-r','clavicle-l','humerus-r','humerus-l','pelvis-r','pelvis-l','os-coxae-r','os-coxae-l','femur-r','femur-l','tibia-r','tibia-l']);
  const muscleLabels = new Set(['deltoid-r','deltoid-l','pectoralis-major-r','pectoralis-major-l','rectus-abdominis','gastrocnemius-r','gastrocnemius-l']);

  const state = {
    catalog:null,
    crosslinks:null,
    models:{},
    mode:'skeleton',
    sex:localStorage.getItem('smd21_anatomy_sex') || 'male',
    layer:'all',
    selected:null,
    query:'',
    labels:true,
    isolate:false,
    skeletonBase:true,
    yaw:0,
    pitch:0,
    zoom:1,
    panX:0,
    panY:0,
    hitShapes:[],
    dragging:false,
    dragPan:false,
    lastX:0,lastY:0,startX:0,startY:0,
    pointers:new Map(),
    pinchDistance:0,
    pinchCenter:null,
    raf:0
  };

  function esc(s='') { return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  const ui=(text)=>window.SMD21I18N?.translateExact?.(text)||text;
  const uiCount=(n,key)=>window.SMD21I18N?.formatCount?.(n,key)||`${n} ${key}`;
  function showToast(msg){const el=$('#toast');el.textContent=ui(msg);el.classList.remove('hidden');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.add('hidden'),1800);}
  function meta(mode=state.mode){return MODE_META[mode] || MODE_META.skeleton;}
  function entriesForMode(mode=state.mode){if(!state.catalog)return[];const key=mode==='skeleton'?'bones':mode;return Array.isArray(state.catalog[key])?state.catalog[key]:[];}
  function modelForMode(mode=state.mode){return state.models[mode] || null;}
  function entryById(id,mode=state.mode){return entriesForMode(mode).find(x=>x.id===id)||null;}

  function visibleEntries(){
    let arr=entriesForMode();
    if(state.mode==='muscles'&&state.layer!=='all')arr=arr.filter(x=>x.layer===state.layer);
    if(state.query){const q=state.query.toLowerCase();arr=arr.filter(x=>[x.name,x.latin,x.location,x.group,x.layer,x.region,x.kind,x.arch,x.tooth_class].some(v=>String(v||'').toLowerCase().includes(q)));}
    return arr;
  }

  function renderList(){
    const arr=visibleEntries(); const total=entriesForMode().length;
    $('#structureCount').textContent=`${arr.length}/${total}`;
    const list=$('#structureList');
    if(!arr.length){list.innerHTML=`<div class="empty-state" style="padding:24px 10px">${ui('No matching structures.')}</div>`;return;}
    list.innerHTML=arr.map(x=>`<button class="structure-item ${state.selected===x.id?'selected':''}" data-structure-id="${esc(x.id)}" role="option" aria-selected="${state.selected===x.id}"><b>${esc(x.name)}</b><small>${esc(x.latin)} · ${esc(x.location)}</small></button>`).join('');
    if(state.selected)list.querySelector(`[data-structure-id="${CSS.escape(state.selected)}"]`)?.scrollIntoView({block:'nearest'});
  }

  function detailLabel(x){
    if(!x)return `Select a ${meta().singular}`;
    if(state.mode==='skeleton')return x.group||'Bone';
    if(state.mode==='muscles')return `${x.layer||'Major'} muscle`;
    if(state.mode==='vessels'&&x.kind)return x.kind==='vein'?'Vein':'Artery';
    if(state.mode==='teeth'&&x.tooth_class)return x.tooth_class.replaceAll('-',' ');
    return meta().singular.replace(/^./,c=>c.toUpperCase());
  }

  function renderDetail(){
    const x=state.selected?entryById(state.selected):null;
    $('#pronounceBtn').disabled=!x;const dictBtn=$('#openDictionaryBtn');if(dictBtn){const tids=x?(state.crosslinks?.anatomy_to_terms?.[`${state.mode}:${x.id}`]||[]):[];dictBtn.classList.toggle('hidden',!tids.length);dictBtn.href=tids.length?`app.html?term=${encodeURIComponent(tids[0])}#dictionary`:'app.html#dictionary';dictBtn.textContent=tids.length>1?`▣ Open in Dictionary (${tids.length})`:'▣ Open in Dictionary';}
    if(!x){
      $('#detailType').textContent=detailLabel(null);
      $('#structureName').textContent=meta().title;
      $('#structureLatin').textContent=`${uiCount(entriesForMode().length,'structures')} · ${ui('English + Latin')}`;
      $('#structureLocation').textContent=ui('Choose a structure from the model or search list.');
      $('#structureDescription').textContent=ui('The model is an educational schematic and is not a diagnostic, treatment or surgical-planning tool.');
      return;
    }
    $('#detailType').textContent=detailLabel(x);
    $('#structureName').textContent=x.name;
    $('#structureLatin').textContent=x.latin;
    $('#structureLocation').textContent=x.location;
    $('#structureDescription').textContent=x.description;
  }

  function pronounceSelected(){
    const x=state.selected?entryById(state.selected):null;if(!x)return;
    if(!('speechSynthesis' in window)){showToast('Speech synthesis is not supported by this browser.');return;}
    speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(`${x.name}. ${x.latin}.`);u.lang='en-US';u.rate=.88;speechSynthesis.speak(u);
  }

  function selectStructure(id,{speak=true}={}){
    if(!entryById(id))return;state.selected=id;renderList();renderDetail();scheduleDraw();if(speak&&$('#autoVoice').checked)pronounceSelected();
  }

  function resetView(show=true){state.yaw=0;state.pitch=0;state.zoom=1;state.panX=0;state.panY=0;scheduleDraw();if(show)showToast('View reset');}
  function clampView(){state.pitch=Math.max(-.85,Math.min(.85,state.pitch));state.zoom=Math.max(.45,Math.min(3.4,state.zoom));}

  function setMode(mode,{reset=true}={}){
    if(!MODES.includes(mode))mode='skeleton';
    state.mode=mode;state.selected=null;state.query='';$('#structureSearch').value='';$('#topSearch').value='';
    $$('.mode-btn').forEach(b=>{const on=b.dataset.mode===state.mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    $('#layerSelect').classList.toggle('hidden',state.mode!=='muscles');
    $('#skeletonBaseWrap').classList.toggle('hidden',!meta().base);
    $('#viewerEyebrow').textContent=`${ui(meta().eyebrow)} · ${uiCount(entriesForMode().length,'structures')}`;
    if(state.mode==='skeleton')$('#viewerEyebrow').textContent=`${ui('Skeleton')} · ${uiCount(206,'bones')}`;
    if(state.mode==='muscles')$('#viewerEyebrow').textContent=`${ui('Muscles')} · ${uiCount(entriesForMode().length,'structures')}`;
    $('#viewerTitle').textContent=ui(meta().title);
    renderList();renderDetail();if(reset)resetView(false);else scheduleDraw();
  }

  function enterViewer(mode){$('#anatomyChooser').classList.add('hidden');$('#anatomyViewer').classList.remove('hidden');setMode(mode);requestAnimationFrame(()=>resizeCanvas());}
  function backToChooser(){state.selected=null;$('#anatomyViewer').classList.add('hidden');$('#anatomyChooser').classList.remove('hidden');window.speechSynthesis?.cancel?.();window.scrollTo({top:0,behavior:'smooth'});}

  function sexAdjust(p,obj){let[x,y,z]=p;if(state.sex==='female'){if(obj.region==='pelvis')x*=1.11;if(obj.region==='shoulder'||obj.region==='chest')x*=.96;}return[x,y,z];}
  function transformPoint(p,obj,mode=state.mode){let[x,y,z]=sexAdjust(p,obj);y-=meta(mode).centerY;const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw);let x1=x*cy+z*sy;let z1=-x*sy+z*cy;const cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);let y1=y*cp-z1*sp;let z2=y*sp+z1*cp;return[x1,y1,z2];}
  function project(t,w,h,scale){const[x,y,z]=t;const perspective=1/Math.max(.56,1+z*.075);return[w/2+state.panX+x*scale*perspective,h/2+state.panY-y*scale*perspective,z,perspective];}

  function themeColors(){
    const light=document.documentElement.dataset.theme==='light';
    return light?{
      bone:'#486b80',boneFill:'rgba(100,133,151,.22)',deep:'#8e4050',superficial:'#c84e5e',joint:'#168aa8',ligament:'#a87914',organ:'#b34762',nerve:'#a16d00',artery:'#c63d4c',vein:'#396fae',tooth:'#8a7753',eye:'#268a86',sinus:'#7656a7',selected:'#ef243d',label:'#123e5d',labelBg:'rgba(255,255,255,.90)',base:'rgba(65,91,107,.20)'
    }:{
      bone:'#d7edf7',boneFill:'rgba(210,238,249,.18)',deep:'#b84a61',superficial:'#e26872',joint:'#49cdea',ligament:'#f2c65b',organ:'#f1849b',nerve:'#ffd35f',artery:'#ff5a68',vein:'#67a9ff',tooth:'#fff0bd',eye:'#63ded7',sinus:'#c092ff',selected:'#ff4055',label:'#e8fbff',labelBg:'rgba(3,23,39,.82)',base:'rgba(207,235,247,.14)'
    };
  }

  function modelObjects(mode=state.mode){const m=modelForMode(mode);if(!m)return[];let objects=m.objects;if(mode==='muscles'&&state.layer!=='all')objects=objects.filter(x=>x.layer===state.layer);if(state.isolate&&state.selected)objects=objects.filter(x=>x.id===state.selected);return objects;}
  function avgDepth(obj,mode=state.mode){let z=0;for(const p of obj.points)z+=transformPoint(p,obj,mode)[2];return z/Math.max(1,obj.points.length);}

  function objectColors(obj,mode,colors){
    if(mode==='muscles')return{stroke:obj.layer==='deep'?colors.deep:colors.superficial,fill:obj.layer==='deep'?colors.deep:colors.superficial};
    if(mode==='skeleton')return{stroke:colors.bone,fill:colors.boneFill};
    if(mode==='joints')return{stroke:colors.joint,fill:colors.joint};
    if(mode==='ligaments')return{stroke:colors.ligament,fill:colors.ligament};
    if(mode==='organs')return{stroke:colors.organ,fill:colors.organ};
    if(mode==='nerves')return{stroke:colors.nerve,fill:colors.nerve};
    if(mode==='vessels'){const c=obj.kind==='vein'?colors.vein:colors.artery;return{stroke:c,fill:c};}
    if(mode==='teeth')return{stroke:colors.tooth,fill:colors.tooth};
    if(mode==='eye')return{stroke:colors.eye,fill:colors.eye};
    return{stroke:colors.sinus,fill:colors.sinus};
  }
  function widthMultiplier(mode){return mode==='skeleton'?3.9:mode==='muscles'?5.2:mode==='organs'?3.1:mode==='joints'?4.3:mode==='teeth'?4.0:mode==='eye'||mode==='sinuses'?3.7:4.6;}

  function drawObject(obj,mode,scale,colors,hit=true,alpha=1){
    const w=canvas.clientWidth,h=canvas.clientHeight;const pts=obj.points.map(p=>project(transformPoint(p,obj,mode),w,h,scale));if(pts.length<2)return;
    const selected=state.selected===obj.id&&state.mode===mode;const width=Math.max(1.25,obj.width*scale*widthMultiplier(mode));const oc=objectColors(obj,mode,colors);
    ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);if(obj.closed)ctx.closePath();ctx.lineCap='round';ctx.lineJoin='round';
    if(selected){ctx.strokeStyle=colors.selected;ctx.fillStyle=colors.selected;ctx.shadowColor=colors.selected;ctx.shadowBlur=14;}else{ctx.strokeStyle=oc.stroke;ctx.fillStyle=oc.fill;ctx.shadowBlur=0;}
    ctx.lineWidth=width;if(obj.fill){ctx.globalAlpha=selected?alpha:Math.min(alpha,.58);ctx.fill();ctx.globalAlpha=alpha;}ctx.stroke();
    if(selected){ctx.shadowBlur=0;ctx.strokeStyle=document.documentElement.dataset.theme==='light'?'#a10b21':'#ffd4d9';ctx.lineWidth=Math.max(1.3,width*.18);ctx.stroke();}
    ctx.restore();if(hit&&alpha>.5)state.hitShapes.push({id:obj.id,mode,pts,width:Math.max(14,width+10),closed:!!obj.closed});
  }

  function labelCandidates(){
    const out=[];if(state.selected)out.push(state.selected);
    const entries=entriesForMode();
    if(!state.selected||state.zoom>1.15){
      if(state.mode==='skeleton'){for(const id of skeletonLabels)if(entryById(id)&&!out.includes(id))out.push(id);}
      else if(state.mode==='muscles'){for(const id of muscleLabels)if(entryById(id)&&!out.includes(id))out.push(id);}
      else for(const e of entries)if(e.label&&!out.includes(e.id))out.push(e.id);
    }
    return out;
  }

  function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  function drawLabels(scale,colors){
    if(!state.labels)return;const model=modelForMode();if(!model)return;const candidates=labelCandidates();ctx.save();ctx.font='700 11px Inter, Segoe UI, Arial';
    for(const id of candidates.slice(0,state.selected?9:11)){
      const obj=model.objects.find(x=>x.id===id),e=entryById(id);if(!obj||!e)continue;if(state.mode==='muscles'&&state.layer!=='all'&&obj.layer!==state.layer)continue;
      const p=obj.points[Math.floor(obj.points.length/2)],sp=project(transformPoint(p,obj),canvas.clientWidth,canvas.clientHeight,scale),text=e.name.replace(/^Right |^Left |^Upper right |^Upper left |^Lower right |^Lower left /,'');const tw=ctx.measureText(text).width;let x=sp[0]+9,y=sp[1]-8;if(x+tw+12>canvas.clientWidth)x=sp[0]-tw-18;if(y<18)y=22;
      ctx.fillStyle=colors.labelBg;ctx.strokeStyle='rgba(74,190,238,.35)';ctx.lineWidth=1;roundRect(ctx,x-5,y-13,tw+10,19,6);ctx.fill();ctx.stroke();ctx.fillStyle=state.selected===id?colors.selected:colors.label;ctx.fillText(text,x,y);ctx.beginPath();ctx.moveTo(sp[0],sp[1]);ctx.lineTo(x-3,y-4);ctx.strokeStyle='rgba(91,202,244,.55)';ctx.stroke();
    }ctx.restore();
  }

  function drawSkeletonBase(scale,colors){
    if(!meta().base||!state.skeletonBase||!state.models.skeleton)return;
    const base=[...state.models.skeleton.objects].sort((a,b)=>avgDepth(a,state.mode)-avgDepth(b,state.mode));
    for(const obj of base){const pts=obj.points.map(p=>project(transformPoint(p,obj,state.mode),canvas.clientWidth,canvas.clientHeight,scale));if(pts.length<2)continue;ctx.save();ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);if(obj.closed)ctx.closePath();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=colors.base;ctx.fillStyle=colors.base;ctx.lineWidth=Math.max(1,obj.width*scale*2.35);if(obj.fill)ctx.fill();ctx.stroke();ctx.restore();}
  }

  function draw(){
    state.raf=0;if(!canvas.width||!modelForMode())return;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const scale=Math.min(w/3.05,h/9.8)*state.zoom*meta().scale;const colors=themeColors();state.hitShapes=[];
    ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='rgba(80,190,235,.22)';ctx.lineWidth=1;const gy=h/2+state.panY+(meta().centerY?0:4.82*scale);ctx.beginPath();ctx.moveTo(Math.max(12,w/2-1.35*scale),gy);ctx.lineTo(Math.min(w-12,w/2+1.35*scale),gy);ctx.stroke();ctx.restore();
    drawSkeletonBase(scale,colors);
    const objects=[...modelObjects()].sort((a,b)=>avgDepth(a)-avgDepth(b));for(const obj of objects)drawObject(obj,state.mode,scale,colors,true,1);drawLabels(scale,colors);
  }
  function scheduleDraw(){if(!state.raf)state.raf=requestAnimationFrame(draw);}
  function resizeCanvas(){if(!stage||stage.classList.contains('hidden'))return;const rect=stage.getBoundingClientRect();if(rect.width<20||rect.height<20)return;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));canvas.style.width=`${rect.width}px`;canvas.style.height=`${rect.height}px`;scheduleDraw();}

  function pointSegmentDistance(px,py,a,b){const vx=b[0]-a[0],vy=b[1]-a[1],wx=px-a[0],wy=py-a[1],c1=vx*wx+vy*wy,c2=vx*vx+vy*vy;let t=c2?c1/c2:0;t=Math.max(0,Math.min(1,t));const dx=px-(a[0]+t*vx),dy=py-(a[1]+t*vy);return Math.hypot(dx,dy);}
  function pointInPolygon(x,y,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const xi=pts[i][0],yi=pts[i][1],xj=pts[j][0],yj=pts[j][1],hit=((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi+.000001)+xi);if(hit)inside=!inside;}return inside;}
  function hitTest(x,y){let best=null,bestD=Infinity;for(let i=state.hitShapes.length-1;i>=0;i--){const h=state.hitShapes[i];if(h.closed&&pointInPolygon(x,y,h.pts))return h;for(let j=0;j<h.pts.length-1;j++){const d=pointSegmentDistance(x,y,h.pts[j],h.pts[j+1]);if(d<h.width/2&&d<bestD){best=h;bestD=d;}}}return best;}
  function pointerPos(e){const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];}
  function onPointerDown(e){canvas.setPointerCapture?.(e.pointerId);state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(state.pointers.size===1){state.dragging=true;state.dragPan=e.shiftKey||e.button===2;state.lastX=e.clientX;state.lastY=e.clientY;state.startX=e.clientX;state.startY=e.clientY;}if(state.pointers.size===2){const p=[...state.pointers.values()];state.pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);state.pinchCenter={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};}}
  function onPointerMove(e){if(!state.pointers.has(e.pointerId))return;state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(state.pointers.size>=2){const p=[...state.pointers.values()].slice(0,2),d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),c={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};if(state.pinchDistance){state.zoom*=d/state.pinchDistance;state.panX+=c.x-state.pinchCenter.x;state.panY+=c.y-state.pinchCenter.y;clampView();scheduleDraw();}state.pinchDistance=d;state.pinchCenter=c;return;}if(!state.dragging)return;const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY;state.lastX=e.clientX;state.lastY=e.clientY;if(state.dragPan){state.panX+=dx;state.panY+=dy;}else{state.yaw+=dx*.009;state.pitch+=dy*.006;clampView();}scheduleDraw();}
  function onPointerUp(e){const hadDrag=Math.hypot(e.clientX-state.startX,e.clientY-state.startY)>5;state.pointers.delete(e.pointerId);if(state.pointers.size<2){state.pinchDistance=0;state.pinchCenter=null;}if(state.pointers.size===0)state.dragging=false;if(!hadDrag&&e.button!==2){const[x,y]=pointerPos(e),h=hitTest(x,y);if(h)selectStructure(h.id);}}

  function applySex(sex){state.sex=sex==='female'?'female':'male';localStorage.setItem('smd21_anatomy_sex',state.sex);$('#sexSelect').value=state.sex;$$('.sex-btn').forEach(b=>{const on=b.dataset.sex===state.sex;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});scheduleDraw();}

  async function init(){
    try{
      const [catalog,crosslinks]=await Promise.all([fetch('data/anatomy/catalog.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Catalog failed');return r.json();}),fetch('data/crosslinks.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)]);
      const pairs=await Promise.all(MODES.map(async mode=>[mode,await fetch(MODE_META[mode].model,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`${MODE_META[mode].eyebrow} model failed`);return r.json();})]));
      const models=Object.fromEntries(pairs);
      if(catalog.bone_count!==206||catalog.bones?.length!==206||models.skeleton.object_count!==206)throw new Error('Skeleton catalog/model count mismatch');
      for(const mode of MODES){const key=mode==='skeleton'?'bones':mode;const entries=Array.isArray(catalog[key])?catalog[key]:[];const model=models[mode];if(!entries.length||!model||model.object_count!==entries.length||model.objects?.length!==entries.length)throw new Error(`${mode} catalog/model count mismatch`);const a=new Set(entries.map(x=>x.id)),b=new Set(model.objects.map(x=>x.id));if(a.size!==b.size||[...a].some(id=>!b.has(id)))throw new Error(`${mode} catalog/model IDs mismatch`);}
      state.catalog=catalog;state.crosslinks=crosslinks;state.models=models;$('#anatomyLoading').classList.add('hidden');applySex(state.sex);renderList();renderDetail();resizeCanvas();
      const params=new URLSearchParams(location.search),deepMode=params.get('mode'),deepStructure=params.get('structure');if(MODES.includes(deepMode)){enterViewer(deepMode);if(deepStructure&&entryById(deepStructure,deepMode))selectStructure(deepStructure,{speak:false});}
    }catch(err){$('#anatomyLoading').textContent=`Anatomy failed to load: ${err.message}`;console.error(err);}
  }

  document.addEventListener('click',e=>{const enter=e.target.closest('[data-enter-mode]');if(enter){enterViewer(enter.dataset.enterMode);return;}const sex=e.target.closest('.sex-btn');if(sex){applySex(sex.dataset.sex);return;}const item=e.target.closest('[data-structure-id]');if(item){selectStructure(item.dataset.structureId);return;}});
  $('#backToAnatomy').addEventListener('click',backToChooser);
  $$('.mode-btn').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('#sexSelect').addEventListener('change',e=>applySex(e.target.value));
  $('#layerSelect').addEventListener('change',e=>{state.layer=e.target.value;if(state.selected){const x=entryById(state.selected);if(x&&state.layer!=='all'&&x.layer!==state.layer)state.selected=null;}renderList();renderDetail();scheduleDraw();});
  $('#skeletonBase').addEventListener('change',e=>{state.skeletonBase=e.target.checked;scheduleDraw();});
  $('#labelsToggle').addEventListener('click',e=>{state.labels=!state.labels;e.currentTarget.classList.toggle('active',state.labels);e.currentTarget.setAttribute('aria-pressed',String(state.labels));scheduleDraw();});
  $('#isolateToggle').addEventListener('click',e=>{state.isolate=!state.isolate;e.currentTarget.classList.toggle('active',state.isolate);e.currentTarget.setAttribute('aria-pressed',String(state.isolate));if(state.isolate&&!state.selected)showToast('Select a structure to isolate');scheduleDraw();});
  $('#pronounceBtn').addEventListener('click',pronounceSelected);
  function setQuery(q){state.query=q.trim();$('#structureSearch').value=state.query;$('#topSearch').value=state.query;renderList();}
  $('#structureSearch').addEventListener('input',e=>setQuery(e.target.value));
  $('#topSearch').addEventListener('input',e=>{if(!$('#anatomyViewer').classList.contains('hidden'))setQuery(e.target.value);});
  $('#structureSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){const first=visibleEntries()[0];if(first)selectStructure(first.id);}});
  $('#topSearch').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('#anatomyViewer').classList.contains('hidden')){const first=visibleEntries()[0];if(first)selectStructure(first.id);}});
  $('#rotateLeft').addEventListener('click',()=>{state.yaw-=.18;scheduleDraw();});$('#rotateRight').addEventListener('click',()=>{state.yaw+=.18;scheduleDraw();});$('#panLeft').addEventListener('click',()=>{state.panX-=24;scheduleDraw();});$('#panRight').addEventListener('click',()=>{state.panX+=24;scheduleDraw();});$('#panUp').addEventListener('click',()=>{state.panY-=24;scheduleDraw();});$('#panDown').addEventListener('click',()=>{state.panY+=24;scheduleDraw();});$('#zoomIn').addEventListener('click',()=>{state.zoom*=1.12;clampView();scheduleDraw();});$('#zoomOut').addEventListener('click',()=>{state.zoom/=1.12;clampView();scheduleDraw();});$('#resetView').addEventListener('click',()=>resetView());
  canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',onPointerDown);canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('pointerup',onPointerUp);canvas.addEventListener('pointercancel',onPointerUp);canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom*=e.deltaY<0?1.08:.925;clampView();scheduleDraw();},{passive:false});
  function toggleMenu(force){const open=force??!$('#sidebar').classList.contains('open');$('#sidebar').classList.toggle('open',open);$('#drawerBackdrop').classList.toggle('show',open);}$('#mobileMenu').addEventListener('click',()=>toggleMenu());$('#drawerBackdrop').addEventListener('click',()=>toggleMenu(false));
  window.addEventListener('smd21:languagechange',()=>{setMode(state.mode,{reset:false});renderDetail();});
  $('#signOutBtn').addEventListener('click',async()=>{await SMD21Auth.signOut();location.href='index.html';});const a=SMD21Auth.getAccount();$('#accountEmail').textContent=a?.email||'Local account';
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#topSearch').focus();}if(e.key==='Escape'){toggleMenu(false);}});
  window.addEventListener('resize',resizeCanvas);new ResizeObserver(resizeCanvas).observe(stage);new MutationObserver(scheduleDraw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  init();
})();
