/* Suhail Medical Dictionary v18.0 — Phase 4 mobile AI/Appearance behavior */
(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const isMobile=()=>innerWidth<=820;

  function placeNewChat(){
    if(!document.body.classList.contains('ai-page'))return;
    const btn=$('#newChat'), actions=$('.ai-topbar .med-top-actions'), header=$('.chat-list-header');
    if(!btn||!actions||!header)return;
    if(isMobile()){
      if(btn.parentElement!==actions) actions.insertBefore(btn,actions.firstChild);
      btn.style.removeProperty('display');
    }else if(btn.parentElement!==header){
      header.appendChild(btn);
    }
  }

  function setupAiNav(){
    if(!document.body.classList.contains('ai-page'))return;
    const btn=$('#aiMobileChatsButton');
    if(!btn||btn.dataset.v18NavBound)return;
    btn.dataset.v18NavBound='1';
    let backdrop=$('.v18-ai-nav-backdrop');
    if(!backdrop){backdrop=document.createElement('div');backdrop.className='v18-ai-nav-backdrop';document.body.appendChild(backdrop);}
    const setOpen=open=>{document.body.classList.toggle('v18-ai-nav-open',!!open&&isMobile());btn.setAttribute('aria-expanded',String(!!open&&isMobile()));};
    btn.addEventListener('click',e=>{if(!isMobile())return;e.preventDefault();e.stopImmediatePropagation();setOpen(!document.body.classList.contains('v18-ai-nav-open'));},true);
    backdrop.addEventListener('click',()=>setOpen(false));
    document.querySelector('.med-sidebar')?.addEventListener('click',e=>{if(isMobile()&&e.target.closest('a,button'))setOpen(false);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
  }

  function decorateAI(){
    if(!document.body.classList.contains('ai-page'))return;
    const heading=$('.ai-page-heading strong');
    if(heading) heading.textContent=isMobile()?'AI Study':'Medical Study Assistant';
    placeNewChat();
    const list=$('#chatList');
    if(list && !list.dataset.v18Observed){
      list.dataset.v18Observed='1';
      new MutationObserver(()=>placeNewChat()).observe(list,{childList:true,subtree:true});
    }
  }

  const init=()=>{decorateAI();setupAiNav();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  addEventListener('resize',decorateAI,{passive:true});
})();
