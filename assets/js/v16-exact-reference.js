(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isDark=()=>['dark','ocean'].includes(document.body.dataset.theme);
  function labelSidePromo(){ /* v18 keeps the authored promo content */ }
  function themeSync(){
    const run=()=>{
      const mode=isDark()?'dark':'light';
      const hero=$('[data-v15-hero-art]'); if(hero) hero.src=`./assets/images/v15/hero-art-${mode}.webp`;
      $$('img[data-v12-asset]').forEach(img=>{const a=img.dataset.v12Asset;if(a)img.src=`./assets/images/v12/${a}-${mode}.webp`;});
      const robot=$('.study-bot img'); if(robot) robot.src=`./assets/images/v15/robot-${mode}.webp`;
    };
    run(); new MutationObserver(run).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
    const grid=$('#termGrid');if(grid)new MutationObserver(run).observe(grid,{childList:true,subtree:true});
  }
  function fluidTilt(){
    if(matchMedia('(pointer:coarse)').matches)return;
    document.addEventListener('pointermove',e=>{
      const card=e.target.closest('.term-card'); if(!card)return;
      const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--rx-tilt-x',`${(-y*3).toFixed(2)}deg`);card.style.setProperty('--rx-tilt-y',`${(x*4).toFixed(2)}deg`);
      card.style.transform=`translateY(-3px) perspective(800px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg)`;
    },{passive:true});
    document.addEventListener('pointerout',e=>{const card=e.target.closest?.('.term-card');if(card&&!card.contains(e.relatedTarget))card.style.transform='';});
  }
  function visibleAccountAvatar(){
    const a=$('.avatar-dot'); if(!a||a.querySelector('img'))return;
    const img=document.createElement('img');img.alt='';img.src='./assets/images/suhail-saeedy.webp';a.textContent='';a.appendChild(img);
  }
  function mobileHeaderBrand(){
    const top=$('.med-topbar'); if(!top||$('.mobile-top-brand')) return;
    const a=document.createElement('a');a.className='mobile-top-brand';a.href='./app.html';a.innerHTML='<img src="./assets/images/logo-book.svg" alt=""><span>Suhail Medical Dictionary</span>';
    const menu=$('.mobile-menu-button',top); if(menu) menu.insertAdjacentElement('afterend',a); else top.insertBefore(a,top.firstChild);
  }
  function mobileBottomIcons(){
    const nav=$('.mobile-bottom-nav');if(!nav||nav.dataset.rx)return;nav.dataset.rx='1';
    const items=[...nav.children];const ico=['⌂','✦','◇','⇩'];items.forEach((n,i)=>{const txt=n.textContent.trim();n.innerHTML=`<span style="font-size:17px;line-height:1">${ico[i]||'•'}</span><span>${txt}</span>`});
  }
  function actualCounts(){
    const stats=$$('.hero-stat');if(stats.length>=4){const result=$('#resultSummary')?.textContent||'';const m=result.match(/[\d,]+/);if(m)stats[0].querySelector('strong').textContent=m[0];}
  }
  function init(){mobileHeaderBrand();labelSidePromo();themeSync();fluidTilt();visibleAccountAvatar();mobileBottomIcons();setTimeout(actualCounts,900);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
