(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function sidebarState(){
    const dash=$('.med-nav-item[href="#dashboard"]');
    const dict=$('.med-nav-item[href="#dictionary"]');
    if(dash&&dict&&innerWidth>820){dash.classList.add('active');dict.classList.remove('active');}
    dash?.addEventListener('click',()=>{if(innerWidth>820){dash.classList.add('active');dict?.classList.remove('active')}});
    dict?.addEventListener('click',()=>{if(innerWidth>820){dict.classList.add('active');dash?.classList.remove('active')}});
  }

  function polishPromo(){
    const promo=$('.med-side-promo');if(!promo)return;
    const strong=$('strong',promo),small=$('small',promo),a=$('a',promo);
    if(strong)strong.innerHTML='Upgrade to<br>Suhail Premium';
    if(small)small.innerHTML='✓ Unlimited AI Study<br>✓ Offline Packs<br>✓ Advanced Filters<br>✓ And More...';
    if(a){a.innerHTML='Go Premium <span>→</span>';a.href='./ai.html'}
  }

  function themeNames(){
    const map={clinical:'☀ Light',dark:'☾ Dark',ocean:'◉ Blue',forest:'❖ Emerald',violet:'✦ Violet',sand:'◇ Pearl'};
    $$('#themeSelect option').forEach(o=>{if(map[o.value])o.textContent=map[o.value]});
  }

  function syncThemeArt(){
    const img=$('[data-v16-hero-art]');if(!img)return;
    const dark=['dark','ocean'].includes(document.body.dataset.theme);
    if(innerWidth>820)img.src=`./assets/images/v16/hero-art-${dark?'dark':'light'}.webp`;
  }

  function accountFallback(){
    const b=$('#accountButton');if(!b)return;
    const dot=$('.avatar-dot',b);if(dot&&!dot.querySelector('img'))dot.setAttribute('aria-hidden','true');
  }

  function detailOpenObserver(){
    const panel=$('#detailPanel');if(!panel)return;
    const apply=()=>{
      if(innerWidth<=820)return;
      const title=$('#detailTermName',panel);
      if(title)panel.setAttribute('data-v17-detail','ready');
    };
    new MutationObserver(apply).observe(panel,{childList:true,subtree:true});apply();
  }

  function assistant(){
    const strip=$('.study-assistant-strip');if(!strip)return;
    const strong=$('strong',strip),small=$('small',strip);
    if(strong)strong.textContent='Ask Suhail AI';
    if(small)small.textContent='Get instant answers, explanations, and study help from our AI medical assistant.';
  }

  function init(){sidebarState();polishPromo();themeNames();syncThemeArt();assistant();accountFallback();detailOpenObserver();
    new MutationObserver(syncThemeArt).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
    addEventListener('resize',()=>{sidebarState();syncThemeArt()},{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
