(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  function finish(){
    // Reference mockups show a small "New" pill beside AI Study.
    const ai=[...$$('.med-nav-item')].find(x=>/AI Study/i.test(x.textContent||''));
    if(ai && !$('.nav-new',ai)){const n=document.createElement('em');n.className='nav-new';n.textContent='New';ai.appendChild(n);}
    // Keep topbar labels concise at desktop sizes.
    const net=$('#networkStatus'); if(net) net.innerHTML='<i></i>Online';
    // Visual fidelity: keep the reference hero art as an isolated image, not a screenshot background.
    const sync=()=>{
      const dark=['dark','ocean'].includes(document.body.dataset.theme);
      const hero=$('[data-v15-hero-art]'); if(hero) hero.src=`./assets/images/v15/hero-art-${dark?'dark':'light'}.webp`;
      const robot=$('.study-bot img'); if(robot) robot.src=`./assets/images/v15/robot-${dark?'dark':'light'}.webp`;
    };
    sync(); new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',finish); else finish();
})();
