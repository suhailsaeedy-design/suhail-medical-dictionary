(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const canvas=$('#anatomyCanvas'); if(!canvas)return;
const gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:false});
const status=$('#modelLoadStatus'), regionList=$('#regionList'), labelLayer=$('#labelLayer'), selectedRegion=$('#selectedRegion'), latinName=$('#latinName'), lodSelect=$('#lodSelect');
const structureKind=$('#structureKind'), structureSide=$('#structureSide'), structureLocation=$('#structureLocation'), structureOverview=$('#structureOverview');
if(!gl){status.textContent='WebGL is unavailable in this browser.';return;}

let manifest=null, adultBoneAtlas=[], currentLod='hd', sexProfile=localStorage.getItem('smd-anatomy-sex')||'male', pendingEntry=null;
let activeLayers=new Set(['skeleton']), activeRegion=null, activePreset=null, meshes=[];
let rotX=-.06,rotY=.18,zoom=1,panX=0,panY=0,drag=false,lastX=0,lastY=0,downX=0,downY=0,pointerMoved=false,panMode=false,auto=!matchMedia('(max-width:820px)').matches,loadToken=0,quizTarget=null,regionFilter='all';
const geometryCache=new Map();
const layerOrder=['muscles','joints','ligaments','organs','eye','teeth','primary_teeth','sinuses','nerves','vessels','systems','skeleton'];
const layerNames={skeleton:'Skeleton',muscles:'Muscles',joints:'Joints',organs:'Organs',eye:'Eye',teeth:'Permanent teeth',primary_teeth:'Primary teeth',sinuses:'Paranasal sinuses',systems:'Integrated systems',ligaments:'Ligaments',nerves:'Major nerves',vessels:'Major vessels'};
const fallbackLatin={
 'Skull':'Cranium','Jaw':'Mandibula','Spine':'Columna vertebralis','Sternum':'Sternum','Rib Cage':'Cavea thoracis','Shoulders':'Cingulum membri superioris','Upper Arm':'Brachium','Forearm':'Antebrachium','Hand':'Manus','Pelvis':'Pelvis','Thigh':'Femur regio','Knee':'Genu','Lower Leg':'Crus','Foot':'Pes',
 'Head Neck':'Caput et collum','Trapezius':'Musculus trapezius','Chest':'Pectus','Abdomen':'Abdomen','Back':'Dorsum','Deltoid':'Musculus deltoideus','Biceps':'Musculus biceps brachii','Forearm Muscles':'Musculi antebrachii','Gluteal':'Musculi glutei','Quadriceps':'Musculus quadriceps femoris','Hamstrings':'Musculi ischiocrurales','Calf':'Sura',
 'Brain':'Encephalon','Left Lung':'Pulmo sinister','Right Lung':'Pulmo dexter','Heart':'Cor','Liver':'Hepar','Stomach':'Gaster','Pancreas':'Pancreas','Left Kidney':'Ren sinister','Right Kidney':'Ren dexter','Spleen':'Lien','Bladder':'Vesica urinaria','Intestines':'Intestina'
};
let presets={
 respiratory:{name:'Respiratory system',regions:['organs:left_lung','organs:right_lung']},
 circulation:{name:'Circulation',regions:['organs:heart','systems:cardiovascular']},
 nervous:{name:'Nervous system',regions:['organs:brain','systems:brain_nerves','systems:spinal_cord','systems:peripheral_nerves']},
 urinary:{name:'Urinary system',regions:['organs:left_kidney','organs:right_kidney','organs:bladder']},
 digestive:{name:'Digestive system',regions:['organs:liver','organs:stomach','organs:pancreas','organs:intestines','organs:spleen']}
};

const vs=`attribute vec3 aPosition;attribute vec3 aNormal;uniform vec2 uRot;uniform float uZoom;uniform vec2 uPan;uniform float uAspect;varying float vLight;varying float vDepth;void main(){float cy=cos(uRot.y),sy=sin(uRot.y),cx=cos(uRot.x),sx=sin(uRot.x);vec3 p=aPosition;vec3 n=aNormal;p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);n=vec3(cy*n.x+sy*n.z,n.y,-sy*n.x+cy*n.z);p=vec3(p.x,cx*p.y-sx*p.z,sx*p.y+cx*p.z);n=vec3(n.x,cx*n.y-sx*n.z,sx*n.y+cx*n.z);float d=1.0/(1.55+p.z*.28);vec2 xy=vec2(p.x/uAspect,p.y)*uZoom*d+uPan;gl_Position=vec4(xy,p.z*.14,1.0);vec3 L=normalize(vec3(.3,.72,1.0));vLight=.28+.72*max(dot(normalize(n),L),0.0);vDepth=p.z;}`;
const fs=`precision mediump float;uniform vec4 uColor;varying float vLight;varying float vDepth;void main(){float rim=clamp(1.0-abs(vDepth)*.18,0.0,1.0);vec3 c=uColor.rgb*(.68+vLight*.52);c+=vec3(.09,.11,.12)*pow(vLight,6.0);c+=vec3(.035,.045,.055)*rim;gl_FragColor=vec4(c,uColor.a);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vs));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
const loc={p:gl.getAttribLocation(prog,'aPosition'),n:gl.getAttribLocation(prog,'aNormal'),rot:gl.getUniformLocation(prog,'uRot'),zoom:gl.getUniformLocation(prog,'uZoom'),pan:gl.getUniformLocation(prog,'uPan'),aspect:gl.getUniformLocation(prog,'uAspect'),color:gl.getUniformLocation(prog,'uColor')};
function resize(){const d=Math.min(devicePixelRatio||1,2),w=Math.max(2,canvas.clientWidth*d|0),h=Math.max(2,canvas.clientHeight*d|0);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}}
function parseOBJ(text){
 const V=[],N=[],P=[],NN=[];let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const ln of text.split(/\r?\n/)){
  if(ln.startsWith('v ')){const a=ln.trim().split(/\s+/);V.push(+a[1],+a[2],+a[3]);}
  else if(ln.startsWith('vn ')){const a=ln.trim().split(/\s+/);N.push(+a[1],+a[2],+a[3]);}
  else if(ln.startsWith('f ')){
   const q=ln.trim().split(/\s+/).slice(1);if(q.length<3)continue;
   for(let t=1;t<q.length-1;t++){
    const tri=[q[0],q[t],q[t+1]],base=P.length;let missing=false;
    for(const tok of tri){const p=tok.split('/'),vi=(+p[0]<0?V.length/3+(+p[0]):+p[0]-1),ni=p[2]?((+p[2]<0?N.length/3+(+p[2]):+p[2]-1)):vi;const x=V[vi*3],y=V[vi*3+1],z=V[vi*3+2];P.push(x,y,z);min[0]=Math.min(min[0],x);min[1]=Math.min(min[1],y);min[2]=Math.min(min[2],z);max[0]=Math.max(max[0],x);max[1]=Math.max(max[1],y);max[2]=Math.max(max[2],z);if(N.length>=3&&(ni*3+2)<N.length)NN.push(N[ni*3],N[ni*3+1],N[ni*3+2]);else{NN.push(0,0,0);missing=true;}}
    if(missing){const ax=P[base+3]-P[base],ay=P[base+4]-P[base+1],az=P[base+5]-P[base+2],bx=P[base+6]-P[base],by=P[base+7]-P[base+1],bz=P[base+8]-P[base+2];let nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx,l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;for(let j=0;j<3;j++){NN[base+j*3]=nx;NN[base+j*3+1]=ny;NN[base+j*3+2]=nz;}}
   }
  }
 }
 return {positions:new Float32Array(P),normals:new Float32Array(NN),min,max};
}
async function fetchGeometry(url){if(geometryCache.has(url))return geometryCache.get(url);const r=await fetch(url);if(!r.ok)throw Error(`${r.status} ${url}`);const g=parseOBJ(await r.text());geometryCache.set(url,g);if(geometryCache.size>18){const k=geometryCache.keys().next().value;if(k!==url)geometryCache.delete(k);}return g;}
function colorFor(layer,alpha=1){const c=manifest.layers[layer]?.color||[.4,.8,1,1];return [c[0],c[1],c[2],alpha];}
function normalizedCopy(g,center,scale){const p=new Float32Array(g.positions.length);const female=sexProfile==='female',sx=female?1.035:1,sy=female?.985:1,sz=female?1.02:1;for(let i=0;i<g.positions.length;i+=3){p[i]=(g.positions[i]-center[0])*scale*sx;p[i+1]=(g.positions[i+1]-center[1])*scale*sy;p[i+2]=(g.positions[i+2]-center[2])*scale*sz;}return {positions:p,normals:g.normals};}
function uploadMesh(g,color,key){const bp=gl.createBuffer(),bn=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bp);gl.bufferData(gl.ARRAY_BUFFER,g.positions,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,bn);gl.bufferData(gl.ARRAY_BUFFER,g.normals,gl.STATIC_DRAW);return {p:bp,n:bn,count:g.positions.length/3,color,key};}
function clearMeshes(){for(const m of meshes){gl.deleteBuffer(m.p);gl.deleteBuffer(m.n);}meshes=[];}
async function loadItems(items,label){
 const token=++loadToken;status.textContent=`Loading ${label}…`;canvas.classList.add('loading');
 try{
  const raw=[];for(let i=0;i<items.length;i++){if(token!==loadToken)return;status.textContent=`Loading ${label}… ${i+1}/${items.length}`;raw.push({...items[i],g:await fetchGeometry(items[i].url)});}
  if(token!==loadToken)return;
  let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const x of raw){for(let k=0;k<3;k++){min[k]=Math.min(min[k],x.g.min[k]);max[k]=Math.max(max[k],x.g.max[k]);}}
  const center=min.map((v,k)=>(v+max[k])/2),span=Math.max(...max.map((v,k)=>v-min[k]))||1,scale=1.72/span;
  clearMeshes();meshes=raw.map(x=>uploadMesh(normalizedCopy(x.g,center,scale),x.color,x.key));
  const verts=meshes.reduce((a,m)=>a+m.count,0);status.textContent=`${label} · ${verts.toLocaleString()} rendered vertices`;canvas.classList.remove('loading');
 }catch(e){status.textContent=`Could not load ${label}. ${e.message}`;canvas.classList.remove('loading');}
}
function layerAlpha(layer){return layer==='skeleton'?.9:layer==='muscles'?.78:layer==='joints'?.92:layer==='ligaments'?.95:layer==='organs'?.82:layer==='eye'?.88:layer==='teeth'?.96:layer==='primary_teeth'?.94:layer==='sinuses'?.58:layer==='nerves'?.96:layer==='vessels'?.88:.62;}
function currentLayerItems(){return [...activeLayers].map(layer=>{const l=manifest.layers[layer];if(!l?.lods)return null;const sexUrl=l.sex_lods?.[sexProfile]?.[currentLod]||l.sex_lods?.[sexProfile]?.hd;const url=sexUrl||l.lods[currentLod]||l.lods.hd||l.lods.standard||l.lods.low;return url?{key:layer,url,color:colorFor(layer,layerAlpha(layer))}:null;}).filter(Boolean);}
function setOverview(){selectedRegion.textContent='Whole body';latinName.textContent='Corpus humanum';if(structureKind)structureKind.textContent='Anatomy overview';if(structureSide)structureSide.textContent='Whole body';if(structureLocation)structureLocation.innerHTML='<b>Location:</b> Whole-body anatomy orientation.';if(structureOverview)structureOverview.textContent='Choose any of the 206 adult bones or another anatomy structure to view its name, location, short educational note and pronunciation.';}
function updateInspector(r){selectedRegion.textContent=r.name;latinName.textContent=r.latin||fallbackLatin[r.name]||'Anatomical structure';if(structureKind)structureKind.textContent=r.kind||layerNames[r.layer]||'Anatomical structure';if(structureSide)structureSide.textContent=r.side||'Regional';if(structureLocation)structureLocation.innerHTML=`<b>Location:</b> ${r.location||'Human anatomy reference region.'}`;if(structureOverview)structureOverview.textContent=r.overview||`${r.name} is included as an educational anatomy reference structure.`;}
async function loadActiveLayers(){activeRegion=null;activePreset=null;setOverview();syncUI();populateRegions();const items=currentLayerItems();await loadItems(items,[...activeLayers].map(x=>layerNames[x]||x).join(' + ')||'Anatomy');}
async function isolateRegion(key,{fromQuiz=false}={}){
 const r=manifest.regions[key];if(!r)return;
 if(quizTarget){const ok=key===quizTarget;$('#quizResult').textContent=ok?'Correct ✓':'Not quite — try another structure.';$('#quizResult').className=ok?'correct':'wrong';if(ok){quizTarget=null;setTimeout(()=>newQuiz(),800);}if(!ok)return;}
 activeRegion=key;activePreset=null;updateInspector(r);syncUI();const highlight=[1.0,.19,.12,1];const isAdultBone=r.catalog==='adult206';let selectedItems;if(isAdultBone){const sk=manifest.layers.skeleton;const baseUrl=sk.sex_lods?.[sexProfile]?.hd||sk.lods?.hd;selectedItems=[{key:'skeleton-context',url:baseUrl,color:[.78,.84,.86,.22]},{key,url:r.url,color:highlight}];}else{selectedItems=[{key,url:r.url,color:highlight}];}await loadItems(selectedItems,isAdultBone?`${r.name} · highlighted in HD adult skeleton`:r.name);document.querySelector('.v20-anatomy-inspector')?.classList.add('v20-selected-flash');setTimeout(()=>document.querySelector('.v20-anatomy-inspector')?.classList.remove('v20-selected-flash'),720);if(!fromQuiz)document.querySelector(`[data-region="${CSS.escape(key)}"]`)?.classList.add('active');if($('#autoVoiceToggle')?.checked)pronounce();
}
function presetKeys(name){const p=presets[name];return Array.isArray(p)?p:(p?.regions||[]);}
function presetName(name){const p=presets[name];return p?.name||name.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());}
async function loadPreset(name){
 const keys=presetKeys(name);if(!keys.length)return;activePreset=name;activeRegion=null;selectedRegion.textContent=presetName(name);latinName.textContent='Anatomy study set';if(structureKind)structureKind.textContent='Preset';if(structureSide)structureSide.textContent='Study set';if(structureLocation)structureLocation.innerHTML='<b>Location:</b> Multiple related anatomical structures.';if(structureOverview)structureOverview.textContent=`${keys.length} related structures are loaded together for comparative study.`;syncUI();
 const items=keys.map(key=>{const r=manifest.regions[key];return r?{key,url:r.url,color:r.color||colorFor(r.layer,.9)}:null;}).filter(Boolean);populateRegions(keys);await loadItems(items,presetName(name));
}
function regionsForState(){if(activePreset)return presetKeys(activePreset);if(activeRegion)return [activeRegion];return [...activeLayers].flatMap(l=>manifest.layers[l]?.regions||[]);}
function populateRegions(forceKeys=null){
 const keys=forceKeys||regionsForState();regionList.innerHTML='';labelLayer.innerHTML='';$('#regionCount').textContent=keys.length;
 const labelPos=[[50,13],[34,26],[64,30],[34,42],[64,46],[39,61],[61,72],[54,87]];let lp=0;
 for(const key of keys){const r=manifest.regions[key];if(!r)continue;const b=document.createElement('button');b.type='button';b.dataset.region=key;b.dataset.level=r.level||'regional';b.dataset.search=[r.name,r.latin,r.kind,r.location,...(r.aliases||[])].filter(Boolean).join(' ').toLowerCase();b.innerHTML=`<i class="bi bi-bullseye"></i><span>${r.name}<small>${r.kind||''}</small></span>`;b.addEventListener('click',()=>isolateRegion(key));regionList.appendChild(b);if(lp<labelPos.length){const l=document.createElement('button');l.type='button';l.dataset.region=key;l.textContent=r.name;l.style.setProperty('--x',labelPos[lp][0]+'%');l.style.setProperty('--y',labelPos[lp][1]+'%');l.onclick=()=>isolateRegion(key);labelLayer.appendChild(l);lp++;}}
 applyRegionFilters();
}
function syncUI(){
 $$('[data-system]').forEach(b=>b.classList.toggle('active',!activePreset&&activeLayers.has(b.dataset.system)));
 $$('[data-preset]').forEach(b=>b.classList.toggle('active',activePreset===b.dataset.preset));
 $$('[data-layer-toggle]').forEach(c=>c.checked=activeLayers.has(c.dataset.layerToggle));
 $$('#regionList button').forEach(b=>b.classList.toggle('active',b.dataset.region===activeRegion));
}
function applyRegionFilters(){const q=String($('#anatomySearch')?.value||'').trim().toLowerCase();$$('#regionList button').forEach(b=>{const qok=!q||(b.dataset.search||b.textContent.toLowerCase()).includes(q);const fok=regionFilter==='all'||b.dataset.level===regionFilter;b.hidden=!(qok&&fok);});const visible=$$('#regionList button').filter(b=>!b.hidden).length;$('#regionCount').textContent=visible;}
function refreshRegionBrowser(){const q=String($('#anatomySearch')?.value||'').trim();populateRegions(q?Object.keys(manifest.regions):null);}
function toggleLayer(layer,on){if(on)activeLayers.add(layer);else activeLayers.delete(layer);if(!activeLayers.size)activeLayers.add('skeleton');loadActiveLayers();}
function peel(){for(const l of layerOrder){if(activeLayers.has(l)&&activeLayers.size>1){activeLayers.delete(l);loadActiveLayers();status.textContent=`Peeled ${layerNames[l]||l} layer`;return;}}status.textContent='Enable multiple systems first, then Peel removes the outer visible layer.';}
function showAll(){activeLayers=new Set(['skeleton','muscles','joints','organs','systems','ligaments','nerves','vessels']);loadActiveLayers();}
function saveView(){const v={activeLayers:[...activeLayers],activeRegion,activePreset,currentLod:'hd',sexProfile,rotX,rotY,zoom,panX,panY};localStorage.setItem('smd-anatomy-view-v20',JSON.stringify(v));status.textContent='View saved on this device.';}
async function loadSavedView(){try{const v=JSON.parse(localStorage.getItem('smd-anatomy-view-v20')||'null');if(!v){status.textContent='No saved anatomy view yet.';return;}activeLayers=new Set((v.activeLayers||[]).filter(x=>manifest.layers[x]?.lods&&Object.keys(manifest.layers[x].lods).length));if(!activeLayers.size)activeLayers=new Set(['skeleton']);currentLod='hd';sexProfile=v.sexProfile||sexProfile;if(lodSelect)lodSelect.value=currentLod;rotX=Number(v.rotX)||0;rotY=Number(v.rotY)||0;zoom=Number(v.zoom)||1;panX=Number(v.panX)||0;panY=Number(v.panY)||0;if(v.activePreset&&presetKeys(v.activePreset).length)await loadPreset(v.activePreset);else if(v.activeRegion&&manifest.regions[v.activeRegion])await isolateRegion(v.activeRegion);else await loadActiveLayers();}catch{status.textContent='Saved view could not be restored.';}}
function pronounce(){const r=activeRegion?manifest.regions[activeRegion]:null,text=r?.pronunciation||r?.name||selectedRegion.textContent;if(!('speechSynthesis'in window)){status.textContent='Pronunciation is not supported by this browser.';return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.76;speechSynthesis.speak(u);status.textContent=`Pronouncing: ${text}`;}
function quizKeys(){const base=activePreset?presetKeys(activePreset):regionsForState();return base.filter(k=>manifest.regions[k]&&(regionFilter==='all'||manifest.regions[k].level===regionFilter));}
function newQuiz(){const keys=quizKeys();if(!keys.length){status.textContent='No structures available for this quiz filter.';return;}quizTarget=keys[Math.floor(Math.random()*keys.length)];$('#quizPanel').hidden=false;$('#quizQuestion').textContent=`Find: ${manifest.regions[quizTarget].name}`;$('#quizResult').textContent='Select the matching structure from the structure list.';$('#quizResult').className='';}
function draw(){resize();gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.CULL_FACE);for(const m of meshes){gl.useProgram(prog);gl.bindBuffer(gl.ARRAY_BUFFER,m.p);gl.enableVertexAttribArray(loc.p);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,m.n);gl.enableVertexAttribArray(loc.n);gl.vertexAttribPointer(loc.n,3,gl.FLOAT,false,0,0);gl.uniform2f(loc.rot,rotX,rotY);gl.uniform1f(loc.zoom,zoom);gl.uniform2f(loc.pan,panX,panY);gl.uniform1f(loc.aspect,canvas.width/canvas.height);gl.uniform4fv(loc.color,m.color);gl.drawArrays(gl.TRIANGLES,0,m.count);}requestAnimationFrame(draw);}

function projectAdultBoneCenter(entry){
 const c=entry?.normalized_center;if(!Array.isArray(c)||c.length<3)return null;
 const female=sexProfile==='female',sx=female?1.035:1,sy=female?.985:1,sz=female?1.02:1;
 let px=c[0]*sx,py=c[1]*sy,pz=c[2]*sz;
 const cy=Math.cos(rotY),syy=Math.sin(rotY),cx=Math.cos(rotX),sxx=Math.sin(rotX);
 let x1=cy*px+syy*pz,z1=-syy*px+cy*pz,y1=py;
 let y2=cx*y1-sxx*z1,z2=sxx*y1+cx*z1;
 const d=1/(1.55+z2*.28),aspect=Math.max(1e-4,canvas.width/canvas.height);
 return [x1/aspect*zoom*d+panX,y2*zoom*d+panY,z2];
}
function pickAdultBone(x,y){
 if(!adultBoneAtlas.length||!activeLayers.has('skeleton'))return null;
 const ndcX=x*2-1,ndcY=1-y*2;let best=null,bestD=Infinity;
 for(const b of adultBoneAtlas){const p=projectAdultBoneCenter(b);if(!p)continue;const dx=p[0]-ndcX,dy=p[1]-ndcY;const d=dx*dx+dy*dy;if(d<bestD){bestD=d;best=b;}}
 // A forgiving screen-space target helps small hand/foot/skull bones on phones.
 const threshold=matchMedia('(max-width:820px)').matches?.115:.08;
 return best&&bestD<threshold*threshold?best.key:null;
}
function bodyPickKey(x,y){
 const layer=activeLayers.has('muscles')&&!activeLayers.has('skeleton')?'muscles':activeLayers.has('skeleton')?'skeleton':activeLayers.has('organs')?'organs':null;if(!layer)return null;
 const left=x<.5;if(layer==='skeleton'){
  const adultKey=pickAdultBone(x,y);if(adultKey)return adultKey;
  if(y<.18)return 'skeleton:skull';
  if(y<.29){if(x<.30||x>.70)return 'skeleton:shoulders';return 'skeleton:rib_cage';}
  if((x<.31||x>.69)&&y<.48)return 'skeleton:upper_arm';
  if((x<.30||x>.70)&&y<.66)return 'skeleton:forearm';
  if((x<.33||x>.67)&&y<.73)return 'skeleton:hand';
  if(y<.52)return 'skeleton:spine';
  if(y<.64)return 'skeleton:pelvis';
  if(y<.78)return left?'skeleton:left_femur':'skeleton:right_femur';
  if(y<.84)return left?'skeleton:left_patella':'skeleton:right_patella';
  if(y<.94)return left?'skeleton:left_tibia':'skeleton:right_tibia';
  return 'skeleton:foot';
 }
 if(layer==='muscles'){
  if(y<.20)return 'muscles:head_neck';
  if(y<.34&&Math.abs(x-.5)<.2)return 'muscles:chest';
  if((x<.32||x>.68)&&y<.43)return left?'muscles:left_deltoid_named':'muscles:right_deltoid_named';
  if((x<.31||x>.69)&&y<.58)return left?'muscles:left_biceps_brachii':'muscles:right_biceps_brachii';
  if(y<.56)return 'muscles:abdomen';
  if(y<.69)return left?'muscles:left_gluteus_maximus':'muscles:right_gluteus_maximus';
  if(y<.82)return left?'muscles:left_rectus_femoris':'muscles:right_rectus_femoris';
  return left?'muscles:left_gastrocnemius':'muscles:right_gastrocnemius';
 }
 if(layer==='organs'){if(y<.2)return 'organs:brain';if(y<.38)return x<.47?'organs:left_lung':x>.56?'organs:right_lung':'organs:heart';if(y<.55)return x>.52?'organs:liver':'organs:stomach';if(y<.72)return x<.46?'organs:left_kidney':x>.54?'organs:right_kidney':'organs:intestines';return 'organs:bladder';}
 return null;
}
function pickFromCanvas(e){if(activePreset||pointerMoved||panMode)return;if(activeRegion&&manifest?.regions?.[activeRegion]?.catalog!=='adult206')return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/Math.max(1,r.width),y=(e.clientY-r.top)/Math.max(1,r.height);const key=bodyPickKey(x,y);if(key&&manifest?.regions?.[key])isolateRegion(key);}
canvas.addEventListener('pointerdown',e=>{drag=true;pointerMoved=false;downX=lastX=e.clientX;downY=lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-downX,e.clientY-downY)>7)pointerMoved=true;const dx=(e.clientX-lastX)/150,dy=(e.clientY-lastY)/150;lastX=e.clientX;lastY=e.clientY;if(panMode){panX+=dx*.22;panY-=dy*.22;}else{rotY+=dx;rotX+=dy;}});canvas.addEventListener('pointerup',e=>{drag=false;pickFromCanvas(e)});canvas.addEventListener('pointercancel',()=>drag=false);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(3.2,Math.max(.38,zoom*(e.deltaY<0?1.09:.91)));},{passive:false});
let pinchDist=0;canvas.addEventListener('touchmove',e=>{if(e.touches.length===2){const [a,b]=e.touches,d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(pinchDist)zoom=Math.min(3.2,Math.max(.38,zoom*(d/pinchDist)));pinchDist=d;}},{passive:true});canvas.addEventListener('touchend',()=>pinchDist=0);
$('#rotateAuto').classList.toggle('active',auto);$('#rotateAuto').onclick=e=>{auto=!auto;e.currentTarget.classList.toggle('active',auto);};$('#panMode').onclick=e=>{panMode=!panMode;e.currentTarget.classList.toggle('active',panMode);};$('#zoomIn').onclick=()=>zoom=Math.min(3.2,zoom*1.18);$('#zoomOut').onclick=()=>zoom=Math.max(.38,zoom/1.18);$('#labelsToggle').onclick=e=>{document.body.classList.toggle('v20-hide-labels');e.currentTarget.classList.toggle('active',!document.body.classList.contains('v20-hide-labels'));};$('#peelLayer').onclick=peel;$('#resetView').onclick=()=>{rotX=-.06;rotY=.18;zoom=matchMedia('(max-width:820px)').matches?1.32:1.15;panX=panY=0;};$('#fullscreenAnatomy').onclick=()=>$('#anatomyStage').requestFullscreen?.();
$$('[data-view]').forEach(b=>b.onclick=()=>{rotY=Number(b.dataset.view)*Math.PI/180;rotX=-.06;$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));});
$$('[data-system]').forEach(b=>b.onclick=()=>{const l=b.dataset.system;activeLayers=new Set([l]);activeRegion=null;activePreset=null;rotX=-.06;rotY=.18;zoom=matchMedia('(max-width:820px)').matches?1.32:1.15;panX=panY=0;loadActiveLayers();});$$('[data-preset]').forEach(b=>b.onclick=()=>loadPreset(b.dataset.preset));$$('[data-layer-toggle]').forEach(c=>c.onchange=()=>toggleLayer(c.dataset.layerToggle,c.checked));
$$('[data-region-filter]').forEach(b=>b.onclick=()=>{regionFilter=b.dataset.regionFilter;$$('[data-region-filter]').forEach(x=>x.classList.toggle('active',x===b));applyRegionFilters();});
$('#showAllSystems').onclick=showAll;$('#saveView').onclick=saveView;$('#loadView').onclick=loadSavedView;$('#pronounceRegion').onclick=pronounce;$('#quizMode').onclick=newQuiz;$('#nextQuiz').onclick=newQuiz;$('#isolateToggle').onclick=()=>{if(activeRegion)loadActiveLayers();else regionList.scrollIntoView({behavior:'smooth',block:'nearest'});};
$('#openDictionary').onclick=()=>{localStorage.setItem('smd-open-term',selectedRegion.textContent);location.href='./app.html#dictionary';};$('#anatomySearch').addEventListener('input',refreshRegionBrowser);
addEventListener('keydown',e=>{const tag=String(document.activeElement?.tagName||'').toLowerCase();const typing=['input','textarea','select'].includes(tag)||document.activeElement?.isContentEditable;if(((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')||(!typing&&e.key==='/')){e.preventDefault();$('#anatomySearch')?.focus();$('#anatomySearch')?.select?.();}if(e.key==='Escape'&&document.activeElement===$('#anatomySearch')){$('#anatomySearch').value='';refreshRegionBrowser();$('#anatomySearch').blur();}});
if(lodSelect)lodSelect.onchange=()=>{currentLod='hd';if(activePreset)loadPreset(activePreset);else if(activeRegion)isolateRegion(activeRegion);else loadActiveLayers();};
const savedTheme=localStorage.getItem('smd-theme')||'clinical';$('#anatomyTheme').value=savedTheme;$('#anatomyTheme').onchange=e=>{document.body.dataset.theme=e.target.value;localStorage.setItem('smd-theme',e.target.value);};document.body.dataset.theme=savedTheme;
const langSel=$('#anatomyLanguage');langSel.value=localStorage.getItem('smd-content-lang')||'en';langSel.onchange=e=>localStorage.setItem('smd-content-lang',e.target.value);
function openAnatomyExplorer(layer='skeleton'){
 document.body.classList.add('v20-anatomy-explorer-open');activeLayers=new Set([layer]);activeRegion=null;activePreset=null;rotX=-.06;rotY=.18;zoom=matchMedia('(max-width:820px)').matches?1.32:1.15;panX=panY=0;if(manifest)loadActiveLayers();else pendingEntry=layer;
}
$$('[data-anatomy-entry]').forEach(b=>b.addEventListener('click',()=>openAnatomyExplorer(b.dataset.anatomyEntry||'skeleton')));
$('#anatomyBack')?.addEventListener('click',()=>{document.body.classList.remove('v20-anatomy-explorer-open');activeRegion=null;activePreset=null;});
$$('[data-anatomy-sex]').forEach(b=>{b.classList.toggle('active',b.dataset.anatomySex===sexProfile);b.addEventListener('click',()=>{sexProfile=b.dataset.anatomySex||'male';localStorage.setItem('smd-anatomy-sex',sexProfile);$$('[data-anatomy-sex]').forEach(x=>x.classList.toggle('active',x.dataset.anatomySex===sexProfile));if(activePreset)loadPreset(activePreset);else if(activeRegion)isolateRegion(activeRegion);else if(manifest)loadActiveLayers();});});
function network(){const el=$('#networkStatus');if(el){el.innerHTML=`<i></i>${navigator.onLine?'Online':'Offline'}`;el.classList.toggle('offline',!navigator.onLine);}}addEventListener('online',network);addEventListener('offline',network);network();
let last=performance.now();function tick(t){if(auto&&!drag)rotY+=(t-last)*.00016;last=t;requestAnimationFrame(tick);}requestAnimationFrame(tick);requestAnimationFrame(draw);
(async()=>{try{manifest=await fetch('./data/anatomy/manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json();});try{const adult=await fetch('./data/anatomy/adult-bones.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null);adultBoneAtlas=adult?.bones||[];}catch{adultBoneAtlas=[];}if(manifest.presets)presets=manifest.presets;if(lodSelect)lodSelect.value='hd';currentLod='hd';const q=new URLSearchParams(location.search),layer=q.get('layer'),region=q.get('region'),preset=q.get('preset');if(layer&&manifest.layers[layer]?.lods&&Object.keys(manifest.layers[layer].lods).length)activeLayers=new Set([layer]);if(layer||region||preset||pendingEntry)document.body.classList.add('v20-anatomy-explorer-open');if(pendingEntry)activeLayers=new Set([pendingEntry]);populateRegions();if(region&&manifest.regions[region])await isolateRegion(region);else if(preset&&presetKeys(preset).length)await loadPreset(preset);else if(layer||pendingEntry)await loadActiveLayers();status.dataset.anatomyVersion=manifest.version||'';}catch(e){status.textContent=`3D anatomy could not start: ${e.message}`;}})();
})();
