(()=>{
'use strict';
if(!document.body.classList.contains('workspace-page') || !document.querySelector('#termGrid')) return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const RTL=new Set(['ps','prs','fa','ar']);
let installPrompt=null;

function toast(message){
  let node=$('.v20-toast');
  if(!node){node=document.createElement('div');node.className='v20-toast';node.setAttribute('role','status');document.body.appendChild(node);}
  node.textContent=message;node.classList.add('show');clearTimeout(node._timer);node._timer=setTimeout(()=>node.classList.remove('show'),3000);
}
function syncPreferences(){
  const theme=localStorage.getItem('smd-theme')||document.body.dataset.theme||'dark';
  const lang=localStorage.getItem('smd-content-lang')||'en';
  document.body.dataset.theme=theme;document.body.dataset.contentDir=RTL.has(lang)?'rtl':'ltr';
  document.documentElement.lang=lang;
  document.body.dataset.bgStyle=localStorage.getItem('smd-bg-style')||'minimal';
  document.body.dataset.accent=localStorage.getItem('smd-accent')||'blue';
  document.body.classList.toggle('effects-off',localStorage.getItem('smd-animations')==='0');
  document.body.classList.toggle('model-glow-off',localStorage.getItem('smd-model-glow')==='0');
  document.body.classList.toggle('reduce-motion',localStorage.getItem('smd-reduce-motion')==='1');
}
function syncNetwork(){
  const offline=!navigator.onLine,status=$('#networkStatus');
  document.body.classList.toggle('v20-offline',offline);
  if(status){status.innerHTML=`<i></i>${offline?'Offline':'Online'}`;status.dataset.state=offline?'offline':'online';}
  $$('a[href="./ai.html"],#detailAI,#aiSelectedButton').forEach(el=>{el.removeAttribute('aria-disabled');el.title=offline?'Offline Study Engine available; optional cloud AI requires internet.':'';});
}
function bindInstall(){
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$$('[data-install-app]').forEach(b=>b.classList.add('v20-install-ready'));});
  $$('[data-install-app]').forEach(btn=>btn.addEventListener('click',async()=>{
    if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return;}
    toast(/iPhone|iPad|iPod/i.test(navigator.userAgent)?'iPhone/iPad: Share → Add to Home Screen.':'Browser menu → Install app / Add to home screen.');
  }));
}
function bindAppearance(){
  const setRadio=(selector,attr,value)=>$$(selector).forEach(b=>{const on=b.getAttribute(attr)===value;b.classList.toggle('active',on);b.setAttribute('aria-checked',String(on));});
  let pendingTheme=document.body.dataset.theme||'dark';
  let pendingBg=localStorage.getItem('smd-bg-style')||'minimal';
  let pendingAccent=localStorage.getItem('smd-accent')||'blue';
  setRadio('[data-theme-choice]','data-theme-choice',pendingTheme);
  setRadio('[data-bg-choice]','data-bg-choice',pendingBg);
  setRadio('[data-accent-choice]','data-accent-choice',pendingAccent);
  $$('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>{pendingTheme=b.dataset.themeChoice;setRadio('[data-theme-choice]','data-theme-choice',pendingTheme);}));
  $$('[data-bg-choice]').forEach(b=>b.addEventListener('click',()=>{pendingBg=b.dataset.bgChoice;setRadio('[data-bg-choice]','data-bg-choice',pendingBg);}));
  $$('[data-accent-choice]').forEach(b=>b.addEventListener('click',()=>{pendingAccent=b.dataset.accentChoice;setRadio('[data-accent-choice]','data-accent-choice',pendingAccent);}));
  const animations=$('#appearanceAnimations'),glow=$('#appearanceGlow'),reduce=$('#appearanceReduceMotion');
  if(animations)animations.checked=localStorage.getItem('smd-animations')!=='0';
  if(glow)glow.checked=localStorage.getItem('smd-model-glow')!=='0';
  if(reduce)reduce.checked=localStorage.getItem('smd-reduce-motion')==='1';
  $('#appearanceApply')?.addEventListener('click',()=>{
    localStorage.setItem('smd-theme',pendingTheme);localStorage.setItem('smd-bg-style',pendingBg);localStorage.setItem('smd-accent',pendingAccent);
    localStorage.setItem('smd-animations',animations?.checked===false?'0':'1');localStorage.setItem('smd-model-glow',glow?.checked===false?'0':'1');localStorage.setItem('smd-reduce-motion',reduce?.checked?'1':'0');
    syncPreferences();
    const theme=$('#themeSelect');if(theme){theme.value=pendingTheme;theme.dispatchEvent(new Event('change',{bubbles:true}));}
    $('#closeSettingsButton')?.click();toast('Appearance saved.');
  });
}
function openDrawer(){document.body.classList.add('v20-drawer-open');let b=$('.v20-drawer-backdrop');if(!b){b=document.createElement('div');b.className='v20-drawer-backdrop';b.onclick=()=>{document.body.classList.remove('v20-drawer-open');b.remove();};document.body.appendChild(b);}}
function ensureMobileMenuButton(){
  const top=$('.med-topbar');if(!top||$('.v2018-menu-btn,.v20-mobile-menu-button',top))return;
  const btn=document.createElement('button');btn.type='button';btn.className='v2018-menu-btn';btn.setAttribute('aria-label','Open navigation');btn.innerHTML='<i class="bi bi-list"></i>';
  btn.addEventListener('click',e=>{e.stopPropagation();openDrawer();});top.prepend(btn);
}
function activateDictionary({category='all',query=''}={}){
  const cat=$('#categorySelect'),search=$('#searchInput'),mirror=$('#heroSearchMirror');
  if(cat){cat.value=[...cat.options].some(o=>o.value===category)?category:'all';cat.dispatchEvent(new Event('change',{bubbles:true}));}
  if(search){search.value=query;search.dispatchEvent(new Event('input',{bubbles:true}));}
  if(mirror)mirror.value=query;
  $('#dictionary')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
function frameworkDialog(module){
  let overlay=$('#v20FrameworkOverlay');
  if(!overlay){overlay=document.createElement('div');overlay.id='v20FrameworkOverlay';overlay.className='v20-framework-overlay';overlay.innerHTML='<section class="v20-framework-card" role="dialog" aria-modal="true"><button type="button" class="v20-framework-close" aria-label="Close">×</button><span class="section-kicker">Safety architecture</span><h3></h3><p></p><div class="v20-framework-points"></div></section>';document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.v20-framework-close'))overlay.classList.remove('open');});}
  $('h3',overlay).textContent=module.title;$('p',overlay).textContent=module.description;
  $('.v20-framework-points',overlay).innerHTML=module.id==='interactions'?'<span>Validated safety-data identifiers</span><span>Interaction severity rules</span><span>Source/version provenance</span><span>Offline-safe result states</span>':'<span>Calculator registry</span><span>Input validation</span><span>Formula/source metadata</span><span>Clear educational limitations</span>';
  overlay.classList.add('open');
}
async function loadClinicalReference(){
  const grid=$('#clinicalReferenceGrid');if(!grid)return;
  try{
    const res=await fetch('./data/clinical-reference.json',{cache:'no-cache'});if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();
    grid.innerHTML=(data.modules||[]).map(m=>`<article class="v20-reference-card" data-module="${m.id}"><div class="v20-reference-icon"><i class="bi ${m.icon}"></i></div><div class="v20-reference-copy"><div class="v20-reference-title"><h3>${m.title}</h3><span class="${m.status}">${m.status_label}</span></div><p>${m.description}</p>${Array.isArray(m.quick_terms)?`<div class="v20-quick-terms">${m.quick_terms.map(t=>`<button type="button" data-quick-term="${t}">${t}</button>`).join('')}</div>`:''}</div><button type="button" class="v20-reference-action" data-module-action="${m.id}">${m.action_label}<i class="bi bi-arrow-right"></i></button></article>`).join('');
    for(const module of data.modules||[]){
      $(`[data-module-action="${module.id}"]`,grid)?.addEventListener('click',()=>{
        if(module.action==='workspace')document.dispatchEvent(new CustomEvent('smd:reference-open',{detail:{module:module.id}}));
        else if(module.action==='category')activateDictionary({category:module.category});
        else if(module.action==='common-conditions')activateDictionary({query:module.quick_terms?.[0]||''});
        else if(module.action==='link'&&module.href)location.assign(module.href);
        else if(module.action==='framework')frameworkDialog(module);
      });
    }
    $$('[data-quick-term]',grid).forEach(btn=>btn.addEventListener('click',()=>activateDictionary({query:btn.dataset.quickTerm||''})));
  }catch(err){grid.innerHTML='<div class="v20-reference-loading error">Clinical reference modules could not load. The dictionary remains available.</div>';console.warn('Clinical reference:',err);}
}
function bindAdvancedFilters(){
  const btn=$('#advancedFiltersButton'),panel=$('.med-search-panel');if(!btn||!panel)return;
  btn.addEventListener('click',()=>{panel.classList.toggle('v20-filters-open');const open=panel.classList.contains('v20-filters-open');btn.setAttribute('aria-expanded',String(open));if(open)$('#categorySelect')?.focus();});
}
function bindClinicalNav(){
  const link=$('.v20-reference-link');link?.addEventListener('click',()=>setTimeout(()=>$('#clinical-reference')?.scrollIntoView({behavior:'smooth',block:'start'}),0));
  addEventListener('hashchange',()=>syncMobileHash());syncMobileHash();
}
function syncMobileHash(){
  const hash=location.hash;const mobile=$('.v20-mobile-nav');if(!mobile)return;
  $$('[data-v20-mobile]',mobile).forEach(x=>x.classList.remove('active'));
  const key='dictionary';$(`[data-v20-mobile="${key}"]`,mobile)?.classList.add('active');
}
function syncAdminLink(){const top=$('#adminLink'),side=$('#adminSidebarLink');if(!top||!side)return;const sync=()=>side.classList.toggle('hidden',top.classList.contains('hidden'));sync();new MutationObserver(sync).observe(top,{attributes:true,attributeFilter:['class']});}

syncPreferences();ensureMobileMenuButton();bindInstall();bindAppearance();bindAdvancedFilters();bindClinicalNav();syncNetwork();syncAdminLink();loadClinicalReference();
addEventListener('online',syncNetwork);addEventListener('offline',syncNetwork);addEventListener('storage',e=>{if(!e.key||e.key.startsWith('smd-'))syncPreferences();});
})();
