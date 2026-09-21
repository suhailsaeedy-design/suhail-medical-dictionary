(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const reduced=()=>document.documentElement.dataset.motion==='reduce'||matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initCardTilt(){
    const grid=$('#termGrid');
    if(!grid) return;
    grid.addEventListener('pointermove',e=>{
      if(reduced()||matchMedia('(hover: none)').matches) return;
      const card=e.target.closest('.term-card'); if(!card) return;
      const r=card.getBoundingClientRect();
      const px=clamp((e.clientX-r.left)/r.width,0,1),py=clamp((e.clientY-r.top)/r.height,0,1);
      card.style.setProperty('--tilt-y',`${((px-.5)*7).toFixed(2)}deg`);
      card.style.setProperty('--tilt-x',`${((.5-py)*5).toFixed(2)}deg`);
      card.style.setProperty('--glow-x',`${(px*100).toFixed(1)}%`);
      card.style.setProperty('--glow-y',`${(py*100).toFixed(1)}%`);
    },{passive:true});
    grid.addEventListener('pointerout',e=>{
      const card=e.target.closest('.term-card'); if(!card||card.contains(e.relatedTarget)) return;
      card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');card.style.removeProperty('--glow-x');card.style.removeProperty('--glow-y');
    });
  }

  function initDetailVisual(){
    const stage=$('.detail-visual'),img=$('#detailImg'); if(!stage||!img) return;
    stage.tabIndex=0;
    stage.setAttribute('aria-label','Interactive medical illustration. Drag or use arrow keys to tilt. Use plus and minus to zoom.');
    const state={rx:0,ry:0,scale:1,drag:false,x:0,y:0,auto:false};
    const apply=()=>{
      stage.style.setProperty('--detail-rx',`${state.rx.toFixed(1)}deg`);
      stage.style.setProperty('--detail-ry',`${state.ry.toFixed(1)}deg`);
      stage.style.setProperty('--detail-scale',state.scale.toFixed(3));
    };
    const reset=()=>{state.rx=0;state.ry=0;state.scale=1;state.auto=false;stage.classList.remove('auto-rotate');const auto=$('#visualAutoRotate');if(auto)auto.setAttribute('aria-pressed','false');apply();};
    const setZoom=d=>{state.scale=clamp(state.scale+d,.88,1.34);apply();};

    stage.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;state.drag=true;state.x=e.clientX;state.y=e.clientY;stage.classList.add('is-dragging');stage.setPointerCapture?.(e.pointerId);});
    stage.addEventListener('pointermove',e=>{if(!state.drag)return;const dx=e.clientX-state.x,dy=e.clientY-state.y;state.x=e.clientX;state.y=e.clientY;state.ry=clamp(state.ry+dx*.16,-22,22);state.rx=clamp(state.rx-dy*.14,-16,16);apply();});
    const stop=e=>{if(!state.drag)return;state.drag=false;stage.classList.remove('is-dragging');try{stage.releasePointerCapture?.(e.pointerId)}catch{}};
    stage.addEventListener('pointerup',stop);stage.addEventListener('pointercancel',stop);
    stage.addEventListener('wheel',e=>{if(!stage.matches(':hover'))return;e.preventDefault();setZoom(e.deltaY<0?.04:-.04);},{passive:false});
    stage.addEventListener('dblclick',reset);
    stage.addEventListener('keydown',e=>{
      let used=true;
      if(e.key==='ArrowLeft')state.ry-=2.5;else if(e.key==='ArrowRight')state.ry+=2.5;else if(e.key==='ArrowUp')state.rx-=2.5;else if(e.key==='ArrowDown')state.rx+=2.5;else if(e.key==='+'||e.key==='=')setZoom(.05);else if(e.key==='-'||e.key==='_')setZoom(-.05);else if(e.key.toLowerCase()==='r')reset();else used=false;
      if(used){state.rx=clamp(state.rx,-16,16);state.ry=clamp(state.ry,-22,22);apply();e.preventDefault();}
    });
    $('#visualZoomIn')?.addEventListener('click',()=>setZoom(.06));
    $('#visualZoomOut')?.addEventListener('click',()=>setZoom(-.06));
    $('#visualReset')?.addEventListener('click',reset);
    $('#visualAutoRotate')?.addEventListener('click',e=>{if(reduced())return;state.auto=!state.auto;stage.classList.toggle('auto-rotate',state.auto);e.currentTarget.setAttribute('aria-pressed',String(state.auto));});

    // Opening a new term starts from a predictable neutral visual state.
    const obs=new MutationObserver(reset);obs.observe(img,{attributes:true,attributeFilter:['src']});
    apply();
  }

  function addImageFallback(){
    document.addEventListener('error',e=>{
      const img=e.target;if(!(img instanceof HTMLImageElement)||!img.closest('.term-image,.detail-visual'))return;
      if(img.dataset.fallbackApplied)return;
      img.dataset.fallbackApplied='1';img.src='assets/images/heart.webp';
    },true);
  }

  document.addEventListener('DOMContentLoaded',()=>{initCardTilt();initDetailVisual();addImageFallback();});
})();
