(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const isMobile=()=>innerWidth<=820;
  const body=document.body;
  const openBtn=$('#aiMobileChatsButton');
  const closeBtn=$('#aiMobileChatsClose');
  const backdrop=$('#aiMobileChatsBackdrop');
  const drawer=$('#aiMobileChatsDrawer');

  function setDrawer(open){
    if(!body.classList.contains('ai-page')) return;
    body.classList.toggle('mobile-chats-open',!!open && isMobile());
    openBtn?.setAttribute('aria-expanded',String(!!open && isMobile()));
    backdrop?.setAttribute('aria-hidden',String(!(!!open && isMobile())));
    if(open && isMobile()) setTimeout(()=>drawer?.querySelector('button, input')?.focus(),60);
  }
  openBtn?.addEventListener('click',()=>setDrawer(true));
  closeBtn?.addEventListener('click',()=>setDrawer(false));
  $('#aiMobileNewChat')?.addEventListener('click',()=>{document.querySelector('#newChat')?.click();setTimeout(()=>setDrawer(false),120);});
  backdrop?.addEventListener('click',()=>setDrawer(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setDrawer(false);});
  addEventListener('resize',()=>{if(!isMobile())setDrawer(false);},{passive:true});

  document.addEventListener('click',e=>{
    const ex=e.target.closest('[data-ai-example]');
    if(ex){
      const input=$('#chatInput');
      if(input){input.value=ex.dataset.aiExample||'';input.focus();input.scrollIntoView({behavior:'smooth',block:'center'});}
    }
    const quick=e.target.closest('[data-ai-prompt]');
    if(quick && isMobile()) setTimeout(()=>$('#chatInput')?.scrollIntoView({behavior:'smooth',block:'center'}),30);
    if(e.target.closest('.chat-list-item') && isMobile()) setTimeout(()=>setDrawer(false),80);
  });

  // Make the mobile heading deterministic even while desktop copy remains unchanged.
  const heading=$('.ai-page-heading strong');
  const syncHeading=()=>{if(heading)heading.textContent=isMobile()?'Ask Suhail AI':'Medical Study Assistant';};
  syncHeading();addEventListener('resize',syncHeading,{passive:true});
})();
