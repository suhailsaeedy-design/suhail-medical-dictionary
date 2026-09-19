(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isMobile=()=>innerWidth<=820;
  const isDark=()=>['dark','ocean'].includes(document.body.dataset.theme);
  const mobileLight='./assets/images/v16/hero-mobile-light.webp';
  const mobileDark='./assets/images/v16/hero-mobile-dark.webp';
  let desktopHero='';

  function syncHero(){}

  function ensureDarkStats(){
    const panel=$('.med-search-panel'),source=$('.hero-stats');
    if(!panel||!source||$('.v18-dark-mobile-stats',panel))return;
    const clone=source.cloneNode(true);
    clone.classList.add('v18-dark-mobile-stats');
    clone.setAttribute('aria-label','Dictionary highlights');
    const row=$('.med-search-row',panel);
    if(row?.nextSibling)panel.insertBefore(clone,row.nextSibling);else panel.appendChild(clone);
  }

  function ensureDictionaryNav(){
    const nav=$('.mobile-bottom-nav'); if(!nav||$('.mobile-nav-dictionary',nav))return;
    const home=$('.mobile-nav-home',nav),ai=$('.mobile-nav-ai',nav);
    const b=document.createElement('button');
    b.type='button';b.className='mobile-nav-dictionary';b.innerHTML='<span>Dictionary</span>';
    nav.insertBefore(b,ai||home?.nextSibling||nav.firstChild);
    b.addEventListener('click',()=>{
      if(!isMobile())return;
      document.body.classList.add('v17-mobile-search-mode');
      $('#heroSearchMirror')?.focus();
      window.scrollTo({top:0,behavior:'smooth'});
      setNavActive('dictionary');
    });
    home?.addEventListener('click',e=>{
      if(!isMobile())return;
      document.body.classList.remove('v17-mobile-search-mode');
      $('#heroSearchMirror')?.blur();
      window.scrollTo({top:0,behavior:'smooth'});
      setNavActive('home');
    },true);
  }

  function ensureDictionaryHead(){
    const content=$('.med-content'); if(!content||$('.v18-mobile-dictionary-head',content))return;
    const h=document.createElement('div');h.className='v18-mobile-dictionary-head';
    h.innerHTML='<button type="button" class="v18-head-menu" aria-label="Open menu">☰</button><button type="button" class="v18-head-back" aria-label="Back">‹</button><strong>Dictionary</strong><span class="v18-head-avatar">●</span>';
    content.insertBefore(h,content.firstChild);
    $('.v18-head-menu',h)?.addEventListener('click',()=>$('.mobile-menu-button')?.click());
    $('.v18-head-back',h)?.addEventListener('click',()=>{
      document.body.classList.remove('v17-mobile-search-mode');
      $('#heroSearchMirror')?.blur();
      window.scrollTo({top:0,behavior:'smooth'});
      setNavActive('home');
    });
  }

  function ensureSearchScopes(){
    const panel=$('.med-search-panel'); if(!panel)return;
    if(!$('.v18-light-search-scopes',panel)){
      const row=document.createElement('div');row.className='v18-light-search-scopes';
      ['All','Terms','Definitions','Specialties'].forEach((name,i)=>{
        const b=document.createElement('button');b.type='button';b.textContent=name;if(i===0)b.classList.add('active');
        b.addEventListener('click',()=>{$$('button',row).forEach(x=>x.classList.toggle('active',x===b));});row.appendChild(b);
      });
      panel.appendChild(row);
    }
    if(!$('.v18-dark-search-scopes',panel)){
      const row=document.createElement('div');row.className='v18-dark-search-scopes';
      [['all','All'],['cardiology','Cardiology'],['neurology','Neurology'],['endocrinology','Endocrine']].forEach(([id,name],i)=>{
        const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.category=id;if(i===0)b.classList.add('active');
        b.addEventListener('click',()=>{
          $$('button',row).forEach(x=>x.classList.toggle('active',x===b));
          const sel=$('#categorySelect'); if(!sel)return;
          const opt=[...sel.options].find(o=>String(o.value).toLowerCase()===id);
          if(opt){sel.value=opt.value;sel.dispatchEvent(new Event('change',{bubbles:true}));}
        });row.appendChild(b);
      });
      panel.appendChild(row);
    }
  }


  function setNavActive(which){
    const nav=$('.mobile-bottom-nav'); if(!nav)return;
    $$('.active',nav).forEach(x=>x.classList.remove('active'));
    const target=which==='dictionary'?$('.mobile-nav-dictionary',nav):$('.mobile-nav-home',nav);
    target?.classList.add('active');
  }

  function syncMode(){
    if(!isMobile())return;
    const profile=$('.mobile-drawer-profile');
    if(profile)profile.style.setProperty('display','none','important');
    const search=document.body.classList.contains('v17-mobile-search-mode');
    if(isDark()&&search)setNavActive('dictionary');
    else if(!search&&!document.body.classList.contains('detail-open'))setNavActive('home');
  }

  function observe(){
    new MutationObserver(()=>{syncMode();}).observe(document.body,{attributes:true,attributeFilter:['data-theme','class']});
    addEventListener('resize',()=>{ensureMobileScaffolding();syncMode();},{passive:true});
  }

  function ensureMobileScaffolding(){
    if(!isMobile()) return;
    ensureDarkStats();
    ensureDictionaryNav();
    ensureDictionaryHead();
    ensureSearchScopes();
  }

  function init(){ensureMobileScaffolding();syncMode();observe();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
