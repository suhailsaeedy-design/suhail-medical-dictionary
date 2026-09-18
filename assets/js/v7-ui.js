(()=>{
'use strict';
const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function setupDrawer(){
 const sidebar=qs('.med-sidebar'),bar=qs('.med-topbar'); if(!sidebar||!bar)return;
 let btn=qs('#mobileMenuButton'); if(!btn){btn=document.createElement('button');btn.id='mobileMenuButton';btn.className='mobile-menu-btn';btn.type='button';btn.setAttribute('aria-label','Open navigation');btn.textContent='☰';bar.prepend(btn);}
 let back=qs('.sidebar-backdrop');if(!back){back=document.createElement('div');back.className='sidebar-backdrop';document.body.appendChild(back);}
 const close=()=>{document.body.classList.remove('sidebar-open');btn.setAttribute('aria-expanded','false');};
 btn.addEventListener('click',e=>{e.stopPropagation();const on=!document.body.classList.contains('sidebar-open');document.body.classList.toggle('sidebar-open',on);btn.setAttribute('aria-expanded',String(on));});
 back.addEventListener('click',close);sidebar.addEventListener('click',e=>{if(innerWidth<=900&&e.target.closest('a,button'))setTimeout(close,70);});
 addEventListener('keydown',e=>{if(e.key==='Escape')close();});
}
function setupDroplets(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let last=0;addEventListener('pointermove',e=>{if(e.pointerType==='touch'||Date.now()-last<42)return;last=Date.now();const d=document.createElement('i');d.className='cursor-droplet';d.style.left=e.clientX+'px';d.style.top=e.clientY+'px';d.style.setProperty('--dx',((Math.random()-.5)*42)+'px');d.style.setProperty('--dy',(14+Math.random()*28)+'px');document.body.appendChild(d);setTimeout(()=>d.remove(),760);},{passive:true});
 addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const r=document.createElement('i');r.className='touch-ripple';r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),680);},{passive:true});
}
function setupTilt(){
 document.addEventListener('pointermove',e=>{const c=e.target.closest?.('.term-card,.about-v7-card');if(!c||matchMedia('(max-width:900px)').matches)return;const b=c.getBoundingClientRect();const x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;c.style.setProperty('--tilt-y',(x*8)+'deg');c.style.setProperty('--tilt-x',(-y*6)+'deg');});
 document.addEventListener('pointerout',e=>{const c=e.target.closest?.('.term-card,.about-v7-card');if(c&&!c.contains(e.relatedTarget)){c.style.removeProperty('--tilt-y');c.style.removeProperty('--tilt-x');}});
}
function setup3DDrag(){
 let active=null,startX=0,base=0;
 document.addEventListener('pointerdown',e=>{const stage=e.target.closest?.('.detail-visual-stage');if(!stage)return;active=stage;startX=e.clientX;base=Number(stage.dataset.angle||0);stage.classList.add('dragging');stage.setPointerCapture?.(e.pointerId);});
 document.addEventListener('pointermove',e=>{if(!active)return;const a=base+(e.clientX-startX)*.65;active.dataset.angle=String(a);const img=qs('.detail-visual',active);if(img)img.style.transform=`rotateY(${a}deg) rotateX(-3deg)`;});
 const stop=()=>{active?.classList.remove('dragging');active=null;};document.addEventListener('pointerup',stop);document.addEventListener('pointercancel',stop);
}
function setupThemeLabels(){
 const labels={clinical:'☀ Light',ocean:'◉ Blue',dark:'☾ Midnight',forest:'❖ Emerald',violet:'✦ Violet',sand:'◇ Pearl'};
 qsa('#themeSelect option,#settingsTheme option').forEach(o=>{if(labels[o.value])o.textContent=labels[o.value];});
}
function setupNetwork(){const update=()=>{qsa('#networkStatus').forEach(x=>{x.classList.toggle('offline',!navigator.onLine);const t=[...x.childNodes].find(n=>n.nodeType===3);if(t)t.nodeValue=navigator.onLine?' Online':' Offline';});};addEventListener('online',update);addEventListener('offline',update);update();}
function setup(){setupDrawer();setupDroplets();setupTilt();setup3DDrag();setupThemeLabels();setupNetwork();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
