/* Suhail Medical Dictionary v18.0 — Phase 8 final UI guard. */
(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  function dictionaryNav(){
    if(!document.body.classList.contains('workspace-page'))return;
    const items=$$('.med-nav-item');
    items.forEach(x=>x.classList.remove('active'));
    const dict=items.find(x=>/Dictionary/i.test(x.textContent||''));
    dict?.classList.add('active');
  }
  function heroTheme(){
    const img=$('[data-v16-hero-art]');if(!img)return;
    const dark=['dark','ocean'].includes(document.body.dataset.theme);
    img.src=dark?'./assets/images/v16/hero-art-dark.webp':'./assets/images/v16/hero-art-light.webp';
  }
  function watchTheme(){
    heroTheme();
    new MutationObserver(heroTheme).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
  }
  function cleanSearchStrip(){
    const row=$('.med-search-row');if(!row)return;
    $$('.hero-search,.hero-search-button,.specialty-select-wrap',row).forEach(x=>x.setAttribute('aria-hidden','true'));
  }
  function init(){dictionaryNav();watchTheme();cleanSearchStrip();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
