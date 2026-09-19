(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isMobile=()=>innerWidth<=820;
  const isDark=()=>['dark','ocean'].includes(document.body.dataset.theme);

  function mobileSidebarState(){
    const dash=$('.med-nav-item[href="#dashboard"]');
    const dict=$('.med-nav-item[href="#dictionary"]');
    if(dash&&dict&&isMobile()){dash.classList.remove('active');dict.classList.add('active');}
    const profile=$('.mobile-drawer-profile');
    if(profile&&isMobile()){
      const name=$('.account-lines b')?.textContent?.trim()||$('#accountMenuName')?.textContent?.trim()||'Medical Learner';
      const strong=$('strong',profile),small=$('small',profile);
      if(strong&&name)strong.textContent=name;
      if(small)small.textContent='Medical Learner';
    }
  }

  function countLabel(){
    const label=$('#resultsCountLabel');if(!label)return;
    const paint=()=>{
      const raw=(label.textContent||'').trim();
      const m=raw.match(/[\d,]+/);
      label.dataset.v17Count=m?`${m[0]} terms`:'';
    };
    paint();new MutationObserver(paint).observe(label,{childList:true,characterData:true,subtree:true});
  }

  function searchMode(){
    const panel=$('.med-search-row');const mirror=$('#heroSearchMirror');const global=$('#searchInput');
    if(!panel||!mirror)return;
    let cancel=$('.v17-mobile-search-cancel',panel);
    if(!cancel){cancel=document.createElement('button');cancel.type='button';cancel.className='v17-mobile-search-cancel';cancel.textContent='Cancel';panel.appendChild(cancel);}
    const apply=(force)=>{
      if(!isMobile()){document.body.classList.remove('v17-mobile-search-mode');return;}
      const value=String(mirror.value||global?.value||'').trim();
      const on=force===true||value.length>0||document.activeElement===mirror;
      document.body.classList.toggle('v17-mobile-search-mode',on);
    };
    mirror.addEventListener('focus',()=>apply(true));
    mirror.addEventListener('input',()=>apply(false));
    global?.addEventListener('input',()=>apply(false));
    cancel.addEventListener('click',()=>{
      mirror.value='';
      if(global){global.value='';global.dispatchEvent(new Event('input',{bubbles:true}));}
      mirror.dispatchEvent(new Event('input',{bubbles:true}));
      document.body.classList.remove('v17-mobile-search-mode');mirror.blur();
      scrollTo({top:0,behavior:'smooth'});
    });
    addEventListener('resize',()=>apply(false),{passive:true});
  }

  function openCardFromVisual(){
    const grid=$('#termGrid');if(!grid)return;
    grid.addEventListener('click',e=>{
      const visual=e.target.closest('.term-visual');if(!visual||!isMobile())return;
      e.preventDefault();e.stopImmediatePropagation();
      const card=visual.closest('.term-card');if(card)card.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    },true);
    grid.addEventListener('keydown',e=>{
      if(!isMobile()||!e.target.closest('.term-visual')||!(e.key==='Enter'||e.key===' '))return;
      e.preventDefault();e.stopImmediatePropagation();
      const card=e.target.closest('.term-card');if(card)card.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    },true);
  }

  function themeSync(){
    const apply=()=>{document.body.classList.toggle('v17-mobile-dark',isMobile()&&isDark());};
    apply();new MutationObserver(apply).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
    addEventListener('resize',()=>{apply();mobileSidebarState()},{passive:true});
  }

  function navPolish(){
    const nav=$('.mobile-bottom-nav');if(!nav)return;
    nav.querySelector('.mobile-nav-home span')?.replaceChildren(document.createTextNode('Home'));
    nav.querySelector('.mobile-nav-ai span')?.replaceChildren(document.createTextNode('AI Study'));
    nav.querySelector('.mobile-nav-selected span')?.replaceChildren(document.createTextNode('Selected'));
    nav.querySelector('.mobile-nav-bookmarks span')?.replaceChildren(document.createTextNode('Bookmarks'));
    nav.querySelector('.mobile-nav-history span')?.replaceChildren(document.createTextNode('History'));
    nav.querySelector('.mobile-nav-offline span')?.replaceChildren(document.createTextNode('Offline'));
    nav.querySelector('.mobile-nav-more span')?.replaceChildren(document.createTextNode('More'));
  }

  function init(){mobileSidebarState();countLabel();searchMode();openCardFromVisual();themeSync();navPolish();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
