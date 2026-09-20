(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

// Hide mobile-only drawer controls on desktop even if an older cached stylesheet flashes.
function syncViewport(){
 const desktop=innerWidth>820;
 $$('.v2018-menu-btn,.v2018-drawer-close').forEach(el=>{el.hidden=desktop;el.setAttribute('aria-hidden',desktop?'true':'false');});
 if(desktop){document.body.classList.remove('v20-drawer-open');$('.v20-drawer-backdrop')?.remove();}
}
addEventListener('resize',syncViewport,{passive:true});syncViewport();

// Give every term card a complete readable label and a reliable image fallback.
function repairTermCards(root=document){
 $$('.term-card',root).forEach(card=>{
   const name=$('.term-name',card); if(name&&!name.title) name.title=name.textContent.trim();
   const img=$('.term-visual-stage img',card); if(img&&!img.dataset.fallbackBound){
     img.dataset.fallbackBound='1';
     img.addEventListener('error',()=>{if(img.dataset.fallbackDone)return;img.dataset.fallbackDone='1';img.src='./assets/images/medical-3d/heart.svg';img.style.objectFit='contain';});
   }
 });
}
repairTermCards();
const termGrid=$('#termGrid');if(termGrid)new MutationObserver(()=>repairTermCards(termGrid)).observe(termGrid,{childList:true,subtree:true});

// Hash navigation should land below the sticky top bar instead of leaving sections awkwardly clipped.
function alignHash(){
 const id=decodeURIComponent((location.hash||'').slice(1)); if(!id)return;
 const el=document.getElementById(id); if(!el)return;
 if(id==='clinical-reference'||id==='dictionary') setTimeout(()=>el.scrollIntoView({block:id==='dictionary'?'start':'start',behavior:'auto'}),30);
}
addEventListener('hashchange',alignHash); if(location.hash) setTimeout(alignHash,80);

// Clinical reference shortcut should not leave the sidebar scrolled halfway down.
$$('.v20-reference-link').forEach(a=>a.addEventListener('click',()=>{const s=$('.med-sidebar');if(s)s.scrollTop=0;}));
})();
