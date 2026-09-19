(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const isMobile=()=>innerWidth<=820;
  function ensureToast(){
    let toast=$('.v17-selected-toast');
    if(toast)return toast;
    toast=document.createElement('div');
    toast.className='v17-selected-toast';
    toast.setAttribute('aria-hidden','true');
    toast.innerHTML='<div class="v17-selected-toast-card" role="status" aria-live="polite"><div class="v17-selected-toast-check">✓</div><h3>Added to Selected</h3><p>Your medical term has been added to your study collection.</p><button type="button">View Selected →</button></div>';
    document.body.appendChild(toast);
    toast.addEventListener('click',e=>{if(e.target===toast)closeToast();});
    toast.querySelector('button')?.addEventListener('click',()=>{closeToast();document.querySelector('#mobileSelectedButton')?.click();});
    return toast;
  }
  function closeToast(){const t=$('.v17-selected-toast');if(!t)return;t.classList.remove('open');t.setAttribute('aria-hidden','true');}
  function showToast(term){
    if(!isMobile()||['dark','ocean'].includes(document.body.dataset.theme))return;
    const t=ensureToast();
    const p=t.querySelector('p');if(p)p.textContent=`“${term||'This term'}” has been added to your collection.`;
    t.classList.add('open');t.setAttribute('aria-hidden','false');
  }
  document.addEventListener('click',e=>{
    const menu=e.target.closest('.mobile-menu-button');
    if(menu && isMobile() && document.body.classList.contains('detail-open') && !['dark','ocean'].includes(document.body.dataset.theme)){
      e.preventDefault();e.stopImmediatePropagation();document.querySelector('#detailCloseButton')?.click();return;
    }
    const b=e.target.closest('#detailSelect');
    if(!b||!isMobile())return;
    const adding=/Add to Selected/i.test(b.textContent||'');
    const term=$('#detailTermName')?.textContent?.trim()||'This term';
    if(adding)setTimeout(()=>showToast(term),220);
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeToast();});
})();
