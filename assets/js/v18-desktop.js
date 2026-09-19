(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function masterCategories(){
    const row=$('#categoryChipRow'); if(!row||row.dataset.v18)return; row.dataset.v18='1';
    const items=[
      ['all','▦','All'],['anatomy','♧','Anatomy'],['physiology','♧','Physiology'],['pharmacology','◇','Pharmacology'],
      ['pathology','◉','Pathology'],['microbiology','✺','Microbiology'],['cardiology','♡','Cardiology'],['neurology','⌘','Neurology'],
      ['pediatrics','♙','Pediatrics'],['surgery','☷','Surgery']
    ];
    row.innerHTML=items.map(([id,ico,label])=>`<button type="button" class="category-chip${id==='all'?' active':''}" data-category-chip="${id}"><span>${ico}</span>${label}</button>`).join('')+'<button type="button" class="category-chip v18-more-chip"><span>•••</span>More⌄</button>';
    const select=$('#categorySelect');
    row.querySelectorAll('[data-category-chip]').forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.categoryChip;
      if(!select)return;
      const option=[...select.options].find(o=>String(o.value).toLowerCase()===id);
      if(option){select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));}
      row.querySelectorAll('[data-category-chip]').forEach(x=>x.classList.toggle('active',x===btn));
    }));
  }

  function detailEnhancer(){
    const panel=$('#detailPanel'); if(!panel)return;
    const apply=()=>{
      const stage=$('.detail-visual-wrap',panel); if(!stage||$('.detail-v18-toolstack',stage))return;
      const tools=document.createElement('div');tools.className='detail-v18-toolstack';tools.innerHTML='<button type="button" title="3D view">3D</button><button type="button" title="Primary visual">●</button><button type="button" title="Alternate visual">◉</button>';stage.appendChild(tools);
    };
    new MutationObserver(apply).observe(panel,{childList:true,subtree:true});apply();
  }

  function versionStamp(){
    $$('.v17-sidebar-quote small').forEach(el=>el.innerHTML='Suhail Medical Dictionary<br>v19.0.0');
  }

  function init(){masterCategories();detailEnhancer();versionStamp();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
