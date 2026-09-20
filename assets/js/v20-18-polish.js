(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
if(document.body.classList.contains('workspace-page')){
  const top=$('.med-topbar');
  if(top && !$('.v2018-menu-btn',top)){
    const b=document.createElement('button');
    b.type='button';b.className='v2018-menu-btn';b.setAttribute('aria-label','Open navigation');b.innerHTML='<i class="bi bi-list"></i>';
    b.addEventListener('click',()=>{document.body.classList.add('v20-drawer-open');let d=$('.v20-drawer-backdrop');if(!d){d=document.createElement('div');d.className='v20-drawer-backdrop';d.addEventListener('click',()=>{document.body.classList.remove('v20-drawer-open');$('.v20-drawer-backdrop')?.remove();d.remove();});document.body.appendChild(d);}});
    top.prepend(b);
  }
  document.addEventListener('click',e=>{
    if(!document.body.classList.contains('v20-drawer-open'))return;
    if(e.target.closest('.med-sidebar,.v2018-menu-btn'))return;
    document.body.classList.remove('v20-drawer-open');
  });
}

  const side=$('.med-sidebar');
  if(side&&!$('.v2018-drawer-close',side)){const c=document.createElement('button');c.type='button';c.className='v2018-drawer-close';c.setAttribute('aria-label','Close navigation');c.innerHTML='<i class="bi bi-x-lg"></i>';c.onclick=()=>{document.body.classList.remove('v20-drawer-open');$('.v20-drawer-backdrop')?.remove();};side.prepend(c);}
  document.querySelectorAll('[data-v20-mobile="more"]').forEach(btn=>btn.addEventListener('click',()=>{document.body.classList.add('v20-drawer-open');let d=$('.v20-drawer-backdrop');if(!d){d=document.createElement('div');d.className='v20-drawer-backdrop';d.addEventListener('click',()=>{document.body.classList.remove('v20-drawer-open');d.remove();});document.body.appendChild(d);}}));

if(document.body.classList.contains('v20-anatomy-page')){
  let sheet=$('#v2018SelectionSheet');
  if(!sheet){
    sheet=document.createElement('div');sheet.id='v2018SelectionSheet';sheet.className='v2018-selection-sheet';
    sheet.innerHTML='<div class="sel-copy"><small>Selected structure</small><strong id="v2018SelName">Whole body</strong></div><button id="v2018SelSpeak" aria-label="Pronounce selected structure"><i class="bi bi-volume-up"></i></button><button class="primary" id="v2018SelDetails" aria-label="Show selected structure details"><i class="bi bi-info-lg"></i></button>';
    document.body.appendChild(sheet);
    $('#v2018SelSpeak',sheet).onclick=()=>$('#pronounceRegion')?.click();
    $('#v2018SelDetails',sheet).onclick=()=>$('.v20-anatomy-inspector')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  const selected=$('#selectedRegion');
  if(selected){
    const sync=()=>{const name=selected.textContent?.trim()||'Whole body';$('#v2018SelName').textContent=name;sheet.classList.toggle('show',name!=='Whole body'&&document.body.classList.contains('v20-anatomy-explorer-open'));};
    new MutationObserver(sync).observe(selected,{childList:true,subtree:true,characterData:true});sync();
  }
}
})();
