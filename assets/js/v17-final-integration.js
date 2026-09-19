(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const RTL=new Set(['ps','prs','fa','ar']);
  const theme=()=>localStorage.getItem('smd-theme')||'clinical';
  const lang=()=>localStorage.getItem('smd-content-lang')||localStorage.getItem('smd-ui-lang')||'en';

  function applyStoredPreferences(){
    document.body.dataset.theme=theme();
    document.body.dataset.contentDir=RTL.has(lang())?'rtl':'ltr';
    document.documentElement.lang=lang();
    document.documentElement.dir='ltr';
    const meta=$('meta[name="theme-color"]');
    if(meta)meta.content=['dark','ocean'].includes(theme())?'#031d43':'#126bf3';
  }

  function syncThemeControls(){
    $$('#themeSelect').forEach(sel=>{
      if([...sel.options].some(o=>o.value===theme()))sel.value=theme();
      if(sel.dataset.v17FinalBound)return;
      sel.dataset.v17FinalBound='1';
      sel.addEventListener('change',()=>{
        localStorage.setItem('smd-theme',sel.value);
        document.body.dataset.theme=sel.value;
        $$('#themeSelect').forEach(other=>{if(other!==sel&&[...other.options].some(o=>o.value===sel.value))other.value=sel.value});
        const meta=$('meta[name="theme-color"]');if(meta)meta.content=['dark','ocean'].includes(sel.value)?'#031d43':'#126bf3';
      });
    });
  }

  function syncLanguageControls(){
    $$('#contentLanguage').forEach(sel=>{
      const saved=lang();
      if([...sel.options].some(o=>o.value===saved))sel.value=saved;
      if(sel.dataset.v17FinalLangBound)return;
      sel.dataset.v17FinalLangBound='1';
      sel.addEventListener('change',()=>{
        const value=sel.value||'en';
        localStorage.setItem('smd-content-lang',value);
        document.body.dataset.contentDir=RTL.has(value)?'rtl':'ltr';
        document.documentElement.lang=value;
        document.documentElement.dir='ltr';
      });
    });
  }

  function decorateMobileNav(){
    $$('.mobile-bottom-nav').forEach(nav=>{
      [...nav.children].forEach(item=>{
        const href=item.getAttribute?.('href')||'';
        const label=(item.textContent||'').trim();
        let cls='mobile-nav-more';
        if(/ai\.html/.test(href)||/AI Study/i.test(label))cls='mobile-nav-ai';
        else if(/bookmarks/.test(href)||/Bookmarks/i.test(label))cls='mobile-nav-bookmarks';
        else if(/selected/.test(href)||/Selected/i.test(label))cls='mobile-nav-selected';
        else if(/history/.test(href)||/History/i.test(label))cls='mobile-nav-history';
        else if(/offline\.html/.test(href)||/Offline/i.test(label))cls='mobile-nav-offline';
        else if(/app\.html/.test(href)||/Home/i.test(label))cls='mobile-nav-home';
        item.classList.add(cls);
        if(!item.querySelector('span')){const span=document.createElement('span');span.textContent=label||'More';item.textContent='';item.appendChild(span);}
      });
    });
  }

  function settingsDeepLink(){
    if(!/app\.html$/i.test(location.pathname)&&!location.pathname.endsWith('/app.html'))return;
    const open=()=>{
      if(location.hash!=='#settings')return;
      const btn=$('#settingsButton'),overlay=$('#settingsOverlay');
      if(btn&&overlay?.classList.contains('hidden'))btn.click();
    };
    window.addEventListener('hashchange',open);
    let tries=0;const timer=setInterval(()=>{tries++;open();if(!$('#settingsOverlay')?.classList.contains('hidden')||tries>30)clearInterval(timer)},100);
  }

  function networkChip(){
    const chip=$('#networkStatus');if(!chip)return;
    const paint=()=>{const online=navigator.onLine;chip.innerHTML=`<i></i><span>${online?'Online':'Offline'}</span>`;chip.dataset.state=online?'online':'offline'};
    paint();addEventListener('online',paint);addEventListener('offline',paint);
  }

  function legalAndAdminClasses(){
    if($('.legal-page'))document.body.classList.add('v17-legal-page');
    if($('.admin-shell'))document.body.classList.add('v17-admin-page');
  }

  function init(){applyStoredPreferences();legalAndAdminClasses();syncThemeControls();syncLanguageControls();decorateMobileNav();settingsDeepLink();networkChip();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
