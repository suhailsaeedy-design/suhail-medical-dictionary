(() => {
  'use strict';

  const EPS = 1e-6;
  const vecSub = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const vecAdd = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
  const vecScale = (a,s) => [a[0]*s,a[1]*s,a[2]*s];
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function norm(v){
    const l=Math.hypot(v[0],v[1],v[2]);
    return l>EPS?[v[0]/l,v[1]/l,v[2]/l]:[0,0,1];
  }
  function sexPoint(p,obj,sex){
    let x=p[0],y=p[1],z=p[2];
    if(sex==='female'){
      if(obj.region==='pelvis')x*=1.11;
      if(obj.region==='shoulder'||obj.region==='chest')x*=.96;
    }
    return [x,y,z];
  }
  function shader(gl,type,source){
    const s=gl.createShader(type);
    gl.shaderSource(s,source);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
      const message=gl.getShaderInfoLog(s)||'Unknown shader error';
      gl.deleteShader(s);
      throw new Error(message);
    }
    return s;
  }
  function program(gl,vsSource,fsSource){
    const p=gl.createProgram(),vs=shader(gl,gl.VERTEX_SHADER,vsSource),fs=shader(gl,gl.FRAGMENT_SHADER,fsSource);
    gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
      const message=gl.getProgramInfoLog(p)||'Unknown WebGL link error';
      gl.deleteProgram(p);
      throw new Error(message);
    }
    return p;
  }
  function pushVertex(batch,p,n,c){
    batch.positions.push(p[0],p[1],p[2]);
    batch.normals.push(n[0],n[1],n[2]);
    batch.colors.push(c[0],c[1],c[2],c[3]);
  }
  function pushTri(batch,a,b,c,na,nb,nc,color){
    pushVertex(batch,a,na,color);pushVertex(batch,b,nb,color);pushVertex(batch,c,nc,color);
  }
  function emptyBatch(){return{positions:[],normals:[],colors:[]};}

  function radiusAt(mode,width,t){
    if(mode==='muscles')return width*2.42*(.58+.62*Math.sin(Math.PI*Math.max(0,Math.min(1,t))));
    return width*1.86*(.92+.12*Math.sin(Math.PI*Math.max(0,Math.min(1,t))));
  }
  function ringBasis(direction){
    const ref=Math.abs(direction[1])<.88?[0,1,0]:[1,0,0];
    const n1=norm(cross(direction,ref));
    return[n1,norm(cross(direction,n1))];
  }
  function addTube(batch,obj,mode,color,sex){
    const src=(obj.points||[]).map(p=>sexPoint(p,obj,sex));
    if(src.length<2)return;
    const count=obj.closed?src.length:src.length-1;
    const sides=mode==='muscles'?12:10;
    for(let i=0;i<count;i++){
      const p0=src[i],p1=src[(i+1)%src.length],delta=vecSub(p1,p0);
      if(Math.hypot(delta[0],delta[1],delta[2])<EPS)continue;
      const d=norm(delta),basis=ringBasis(d),n1=basis[0],n2=basis[1];
      const t0=i/Math.max(1,count),t1=(i+1)/Math.max(1,count);
      const r0=radiusAt(mode,obj.width||.03,t0),r1=radiusAt(mode,obj.width||.03,t1);
      for(let s=0;s<sides;s++){
        const a0=(s/sides)*Math.PI*2,a1=((s+1)/sides)*Math.PI*2;
        const na=norm(vecAdd(vecScale(n1,Math.cos(a0)),vecScale(n2,Math.sin(a0))));
        const nb=norm(vecAdd(vecScale(n1,Math.cos(a1)),vecScale(n2,Math.sin(a1))));
        const p00=vecAdd(p0,vecScale(na,r0)),p01=vecAdd(p0,vecScale(nb,r0));
        const p10=vecAdd(p1,vecScale(na,r1)),p11=vecAdd(p1,vecScale(nb,r1));
        pushTri(batch,p00,p10,p11,na,na,nb,color);
        pushTri(batch,p00,p11,p01,na,nb,nb,color);
      }
      if(!obj.closed&&i===0){
        const capN=vecScale(d,-1);
        for(let s=0;s<sides;s++){
          const a0=(s/sides)*Math.PI*2,a1=((s+1)/sides)*Math.PI*2;
          const q0=vecAdd(p0,vecScale(vecAdd(vecScale(n1,Math.cos(a0)),vecScale(n2,Math.sin(a0))),r0));
          const q1=vecAdd(p0,vecScale(vecAdd(vecScale(n1,Math.cos(a1)),vecScale(n2,Math.sin(a1))),r0));
          pushTri(batch,p0,q1,q0,capN,capN,capN,color);
        }
      }
      if(!obj.closed&&i===count-1){
        const capN=d;
        for(let s=0;s<sides;s++){
          const a0=(s/sides)*Math.PI*2,a1=((s+1)/sides)*Math.PI*2;
          const q0=vecAdd(p1,vecScale(vecAdd(vecScale(n1,Math.cos(a0)),vecScale(n2,Math.sin(a0))),r1));
          const q1=vecAdd(p1,vecScale(vecAdd(vecScale(n1,Math.cos(a1)),vecScale(n2,Math.sin(a1))),r1));
          pushTri(batch,p1,q0,q1,capN,capN,capN,color);
        }
      }
    }
  }
  function polygonNormal(points){
    let n=[0,0,0];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      n[0]+=(a[1]-b[1])*(a[2]+b[2]);
      n[1]+=(a[2]-b[2])*(a[0]+b[0]);
      n[2]+=(a[0]-b[0])*(a[1]+b[1]);
    }
    return norm(n);
  }
  function addPlate(batch,obj,color,sex){
    const pts=(obj.points||[]).map(p=>sexPoint(p,obj,sex));
    if(pts.length<3){addTube(batch,obj,'skeleton',color,sex);return;}
    const n=polygonNormal(pts),half=Math.max((obj.width||.02)*1.32,.014);
    const front=pts.map(p=>vecAdd(p,vecScale(n,half)));
    const back=pts.map(p=>vecAdd(p,vecScale(n,-half)));
    const cf=front.reduce((a,p)=>vecAdd(a,p),[0,0,0]).map(v=>v/front.length);
    const cb=back.reduce((a,p)=>vecAdd(a,p),[0,0,0]).map(v=>v/back.length);
    for(let i=0;i<pts.length;i++){
      const j=(i+1)%pts.length;
      pushTri(batch,cf,front[i],front[j],n,n,n,color);
      const bn=vecScale(n,-1);
      pushTri(batch,cb,back[j],back[i],bn,bn,bn,color);
      const sideN=norm(cross(vecSub(front[j],front[i]),n));
      pushTri(batch,front[i],back[i],back[j],sideN,sideN,sideN,color);
      pushTri(batch,front[i],back[j],front[j],sideN,sideN,sideN,color);
    }
  }
  function addObject(batch,obj,mode,color,sex){
    if(obj.closed&&obj.fill)addPlate(batch,obj,color,sex);
    else addTube(batch,obj,mode,color,sex);
  }

  function create(canvas,stage){
    if(!canvas||!stage)return null;
    let gl=null;
    try{
      gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false})||
         canvas.getContext('experimental-webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false});
    }catch(_){}
    if(!gl){
      canvas.style.display='none';
      return{supported:false,canRender:()=>false,resize:()=>{},render:()=>false};
    }

    const vs=[
      'attribute vec3 a_position;',
      'attribute vec3 a_normal;',
      'attribute vec4 a_color;',
      'uniform vec2 u_viewport;',
      'uniform vec2 u_pan;',
      'uniform float u_scale;',
      'uniform float u_centerY;',
      'uniform float u_yaw;',
      'uniform float u_pitch;',
      'varying vec3 v_normal;',
      'varying vec4 v_color;',
      'void main(){',
      '  vec3 p=a_position;',
      '  p.y-=u_centerY;',
      '  float cy=cos(u_yaw), sy=sin(u_yaw);',
      '  float x1=p.x*cy+p.z*sy;',
      '  float z1=-p.x*sy+p.z*cy;',
      '  float cp=cos(u_pitch), sp=sin(u_pitch);',
      '  float y1=p.y*cp-z1*sp;',
      '  float z2=p.y*sp+z1*cp;',
      '  float perspective=1.0/max(0.56,1.0+z2*0.075);',
      '  vec2 pixel=vec2(u_viewport.x*0.5+u_pan.x+x1*u_scale*perspective,u_viewport.y*0.5+u_pan.y-y1*u_scale*perspective);',
      '  vec2 clip=vec2(pixel.x/u_viewport.x*2.0-1.0,1.0-pixel.y/u_viewport.y*2.0);',
      '  float depth=clamp(z2*0.08,-0.92,0.92);',
      '  gl_Position=vec4(clip,depth,1.0);',
      '  vec3 n=a_normal;',
      '  float nx=n.x*cy+n.z*sy;',
      '  float nz=-n.x*sy+n.z*cy;',
      '  float ny=n.y*cp-nz*sp;',
      '  float nnz=n.y*sp+nz*cp;',
      '  v_normal=normalize(vec3(nx,ny,nnz));',
      '  v_color=a_color;',
      '}'
    ].join('\\n');
    const fs=[
      'precision mediump float;',
      'varying vec3 v_normal;',
      'varying vec4 v_color;',
      'void main(){',
      '  vec3 n=normalize(v_normal);',
      '  vec3 key=normalize(vec3(-0.35,0.72,-0.58));',
      '  vec3 fill=normalize(vec3(0.55,-0.18,-0.36));',
      '  float diffuse=max(dot(n,key),0.0);',
      '  float secondary=max(dot(n,fill),0.0);',
      '  float rim=pow(1.0-abs(n.z),2.0);',
      '  float light=0.34+0.58*diffuse+0.16*secondary+0.12*rim;',
      '  vec3 rgb=clamp(v_color.rgb*light,0.0,1.0);',
      '  gl_FragColor=vec4(rgb,v_color.a);',
      '}'
    ].join('\\n');

    let prog;
    try{prog=program(gl,vs,fs);}
    catch(error){
      console.warn('WebGL anatomy renderer unavailable:',error);
      canvas.style.display='none';
      return{supported:false,canRender:()=>false,resize:()=>{},render:()=>false};
    }

    const loc={
      pos:gl.getAttribLocation(prog,'a_position'),
      normal:gl.getAttribLocation(prog,'a_normal'),
      color:gl.getAttribLocation(prog,'a_color'),
      viewport:gl.getUniformLocation(prog,'u_viewport'),
      pan:gl.getUniformLocation(prog,'u_pan'),
      scale:gl.getUniformLocation(prog,'u_scale'),
      centerY:gl.getUniformLocation(prog,'u_centerY'),
      yaw:gl.getUniformLocation(prog,'u_yaw'),
      pitch:gl.getUniformLocation(prog,'u_pitch')
    };
    let cssW=1,cssH=1,currentKey='',scene={base:null,main:null};

    function destroy(upload){
      if(!upload)return;
      gl.deleteBuffer(upload.position);
      gl.deleteBuffer(upload.normal);
      gl.deleteBuffer(upload.color);
    }
    function upload(batch){
      const count=batch.positions.length/3;
      if(!count)return null;
      const position=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,position);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(batch.positions),gl.STATIC_DRAW);
      const normal=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(batch.normals),gl.STATIC_DRAW);
      const color=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,color);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(batch.colors),gl.STATIC_DRAW);
      return{position,normal,color,count};
    }
    function palette(opts,obj,base){
      if(base)return opts.lightTheme?[0.47,0.52,0.54,.21]:[0.72,0.78,0.78,.23];
      if(opts.selected&&obj.id===opts.selected)return opts.lightTheme?[0.02,.55,.82,1]:[.08,.78,1,1];
      if(opts.mode==='muscles')return obj.layer==='deep'?[.50,.12,.18,1]:[.78,.20,.24,1];
      return opts.lightTheme?[.68,.59,.41,1]:[.90,.85,.69,1];
    }
    function sceneKey(opts){
      return[
        opts.mode,opts.sex,opts.layer,opts.isolate?'1':'0',opts.selected||'',
        opts.skeletonBase?'1':'0',opts.lightTheme?'l':'d',
        opts.model?.object_count||0,opts.skeletonModel?.object_count||0
      ].join('|');
    }
    function rebuild(opts,key){
      destroy(scene.base);destroy(scene.main);scene={base:null,main:null};
      if(opts.mode==='muscles'&&opts.skeletonBase&&opts.skeletonModel){
        const baseBatch=emptyBatch();
        for(const obj of opts.skeletonModel.objects||[])addObject(baseBatch,obj,'skeleton',palette(opts,obj,true),opts.sex);
        scene.base=upload(baseBatch);
      }
      const mainBatch=emptyBatch();
      let objects=[...(opts.model?.objects||[])];
      if(opts.mode==='muscles'&&opts.layer&&opts.layer!=='all')objects=objects.filter(x=>x.layer===opts.layer);
      if(opts.isolate&&opts.selected)objects=objects.filter(x=>x.id===opts.selected);
      for(const obj of objects)addObject(mainBatch,obj,opts.mode,palette(opts,obj,false),opts.sex);
      scene.main=upload(mainBatch);
      currentKey=key;
    }
    function bind(uploadObj){
      gl.bindBuffer(gl.ARRAY_BUFFER,uploadObj.position);gl.enableVertexAttribArray(loc.pos);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,uploadObj.normal);gl.enableVertexAttribArray(loc.normal);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,uploadObj.color);gl.enableVertexAttribArray(loc.color);gl.vertexAttribPointer(loc.color,4,gl.FLOAT,false,0,0);
    }
    function draw(uploadObj,writeDepth){
      if(!uploadObj)return;
      gl.depthMask(writeDepth);
      bind(uploadObj);
      gl.drawArrays(gl.TRIANGLES,0,uploadObj.count);
    }
    function resize(width,height,dpr){
      cssW=Math.max(1,width||1);cssH=Math.max(1,height||1);
      const ratio=Math.min(dpr||window.devicePixelRatio||1,2);
      const w=Math.max(1,Math.floor(cssW*ratio)),h=Math.max(1,Math.floor(cssH*ratio));
      if(canvas.width!==w)canvas.width=w;
      if(canvas.height!==h)canvas.height=h;
      canvas.style.width=cssW+'px';canvas.style.height=cssH+'px';
      gl.viewport(0,0,w,h);
    }
    function canRender(mode){return mode==='skeleton'||mode==='muscles';}
    function clear(){
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    }
    function render(opts){
      clear();
      if(!canRender(opts.mode)||!opts.model)return false;
      const key=sceneKey(opts);
      if(key!==currentKey)rebuild(opts,key);
      gl.useProgram(prog);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.disable(gl.CULL_FACE);
      gl.uniform2f(loc.viewport,cssW,cssH);
      gl.uniform2f(loc.pan,opts.panX||0,opts.panY||0);
      gl.uniform1f(loc.scale,Math.min(cssW/3.05,cssH/9.8)*(opts.zoom||1)*(opts.modeScale||1));
      gl.uniform1f(loc.centerY,opts.centerY||0);
      gl.uniform1f(loc.yaw,opts.yaw||0);
      gl.uniform1f(loc.pitch,opts.pitch||0);
      draw(scene.base,false);
      draw(scene.main,true);
      gl.depthMask(true);
      return true;
    }
    return{supported:true,canRender,resize,render};
  }

  window.SMD3DRenderer={create};
})();

