/* Suhail Medical Dictionary v18.0 — FINAL integration behavior. */
(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const RTL=new Set(['ps','prs','fa','ar']);
  const isMobile=()=>innerWidth<=820;

  function savedTheme(){return localStorage.getItem('smd-theme')||document.body.dataset.theme||'clinical'}
  function savedLanguage(){return localStorage.getItem('smd-content-lang')||localStorage.getItem('smd-ui-lang')||'en'}

  function applyPreferences(){
    const t=savedTheme(),l=savedLanguage();
    const bg=localStorage.getItem('smd-bg-style')||'bubbles';
    const accent=localStorage.getItem('smd-accent')||'blue';
    document.body.dataset.theme=t;
    document.body.dataset.bgStyle=bg;
    document.body.dataset.accent=accent;
    document.body.dataset.contentDir=RTL.has(l)?'rtl':'ltr';
    document.body.classList.toggle('effects-off',localStorage.getItem('smd-animations')==='0');
    document.body.classList.toggle('model-glow-off',localStorage.getItem('smd-model-glow')==='0');
    document.body.classList.toggle('reduce-motion',localStorage.getItem('smd-reduce-motion')==='1');
    document.documentElement.lang=l;
    /* Keep app chrome LTR so RTL content does not mirror the approved shell. */
    document.documentElement.dir='ltr';
    const meta=$('meta[name="theme-color"]');
    const themeColor={dark:'#031d43',ocean:'#063f82',forest:'#215f43',violet:'#55408f',sand:'#8b632f',clinical:'#1679ef'};
    if(meta)meta.content=themeColor[t]||themeColor.clinical;
  }

  function syncControls(){
    $$('select#themeSelect').forEach(sel=>{
      const t=savedTheme();
      if([...sel.options].some(o=>o.value===t))sel.value=t;
      if(sel.dataset.v18FinalBound)return;
      sel.dataset.v18FinalBound='1';
      sel.addEventListener('change',()=>{
        localStorage.setItem('smd-theme',sel.value);
        document.body.dataset.theme=sel.value;
        $$('select#themeSelect').forEach(x=>{if(x!==sel&&[...x.options].some(o=>o.value===sel.value))x.value=sel.value});
      });
    });
    $$('select#contentLanguage').forEach(sel=>{
      const l=savedLanguage();
      if([...sel.options].some(o=>o.value===l))sel.value=l;
      if(sel.dataset.v18FinalLangBound)return;
      sel.dataset.v18FinalLangBound='1';
      sel.addEventListener('change',()=>{
        localStorage.setItem('smd-content-lang',sel.value||'en');
        document.body.dataset.contentDir=RTL.has(sel.value)?'rtl':'ltr';
        document.documentElement.lang=sel.value||'en';
      });
    });
  }

  function appDesktopNav(){
    if(!document.body.classList.contains('workspace-page')||!$('#dictionary'))return;
    const dash=$('.med-nav-item[href="#dashboard"]');
    const dict=$('.med-nav-item[href="#dictionary"]');
    if(!dash||!dict)return;
    const paint=()=>{
      if(isMobile())return;
      const dashboard=location.hash==='#dashboard';
      dash.classList.toggle('active',dashboard);
      dict.classList.toggle('active',!dashboard);
    };
    paint();
    if(dict.dataset.v18FinalNavBound)return;
    dict.dataset.v18FinalNavBound='1';
    addEventListener('hashchange',paint);
    dash.addEventListener('click',()=>requestAnimationFrame(paint));
    dict.addEventListener('click',()=>requestAnimationFrame(paint));
  }

  function desktopCleanup(){
    if(isMobile())return;
    document.body.classList.remove('v17-mobile-search-mode','v17-mobile-dark','v18-ai-nav-open','mobile-menu-open');
    $('.med-sidebar')?.classList.remove('open');
    $('.mobile-nav-backdrop')?.classList.remove('show');
  }

  function settingsDeepLink(){
    if(!/app\.html$/i.test(location.pathname)&&!location.pathname.endsWith('/app.html'))return;
    const open=()=>{
      if(location.hash!=='#settings')return;
      const overlay=$('#settingsOverlay');
      if(overlay?.classList.contains('hidden'))$('#settingsButton')?.click();
    };
    addEventListener('hashchange',open);
    let tries=0;
    const timer=setInterval(()=>{tries++;open();if(!$('#settingsOverlay')?.classList.contains('hidden')||tries>30)clearInterval(timer)},100);
  }

  function networkStatus(){
    const chip=$('#networkStatus');if(!chip)return;
    const draw=()=>{
      const online=navigator.onLine;
      const dot='<i></i>';
      chip.innerHTML=dot+(online?'Online':'Offline');
      chip.dataset.state=online?'online':'offline';
    };
    draw();addEventListener('online',draw);addEventListener('offline',draw);
  }

  function markPageClasses(){
    if($('.legal-page'))document.body.classList.add('v17-legal-page','v18-legal-page');
    if($('.admin-shell'))document.body.classList.add('v17-admin-page','v18-admin-page');
  }

  function preserveSidebarLabels(){
    if(isMobile())return;
    $$('.med-nav-item').forEach(item=>{
      [...item.children].forEach((child,index)=>{
        if(index>0&&child.matches('span')){
          child.style.removeProperty('display');
          child.style.removeProperty('visibility');
          child.style.removeProperty('opacity');
        }
      });
    });
  }

  function installPreferenceSync(){
    if(window.__v18PreferenceSyncInstalled)return;
    window.__v18PreferenceSyncInstalled=true;
    addEventListener('storage',e=>{
      if(!e.key||e.key.startsWith('smd-')){applyPreferences();syncControls();preserveSidebarLabels();}
    });
    new MutationObserver(()=>preserveSidebarLabels()).observe(document.documentElement,{attributes:true,attributeFilter:['class','style']});
  }

  function init(){
    applyPreferences();
    markPageClasses();
    syncControls();
    desktopCleanup();
    preserveSidebarLabels();
    installPreferenceSync();
    appDesktopNav();
    settingsDeepLink();
    networkStatus();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  addEventListener('resize',()=>{desktopCleanup();preserveSidebarLabels();appDesktopNav();},{passive:true});
})();
