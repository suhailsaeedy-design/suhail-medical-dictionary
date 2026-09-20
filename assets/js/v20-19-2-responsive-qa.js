(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
if(!document.body.classList.contains('workspace-page'))return;

const LANGS=[['en','English'],['ps','پښتو'],['prs','دري'],['fa','فارسی'],['tr','Türkçe'],['ar','العربية'],['zh','中文']];
const THEMES=[['clinical','Light'],['dark','Dark'],['ocean','Blue']];
const isMobile=()=>matchMedia('(max-width:820px)').matches;

function closeDrawer(){document.body.classList.remove('v20-drawer-open');$('.v20-drawer-backdrop')?.remove();}
function openDrawer(){document.body.classList.add('v20-drawer-open');let d=$('.v20-drawer-backdrop');if(!d){d=document.createElement('div');d.className='v20-drawer-backdrop';d.setAttribute('aria-hidden','true');d.addEventListener('click',closeDrawer);document.body.appendChild(d);}}

function normalizeMenu(){
  const top=$('.med-topbar'); if(!top)return;
  const all=$$('.v2018-menu-btn,.v20-mobile-menu-button,.sidebar-toggle',top);
  let menu=all.find(x=>x.classList.contains('v2018-menu-btn'))||all[0];
  all.forEach(x=>{if(x!==menu)x.remove();});
  if(!menu){menu=document.createElement('button');menu.type='button';menu.className='v2018-menu-btn';menu.innerHTML='<i class="bi bi-list"></i>';top.prepend(menu);}
  menu.classList.add('v2018-menu-btn');menu.setAttribute('aria-label','Open navigation');menu.hidden=!isMobile();
  menu.onclick=e=>{e.preventDefault();e.stopPropagation();openDrawer();};
  const side=$('.med-sidebar');if(side){let close=$('.v2018-drawer-close',side);if(!close){close=document.createElement('button');close.type='button';close.className='v2018-drawer-close';close.innerHTML='<i class="bi bi-x-lg"></i>';side.prepend(close);}close.setAttribute('aria-label','Close navigation');close.onclick=closeDrawer;}
  $$('.med-sidebar a,.med-sidebar button').forEach(x=>{if(!x.classList.contains('v20191-sidebar-collapse')&&!x.classList.contains('v2018-drawer-close'))x.addEventListener('click',()=>{if(isMobile())closeDrawer();});});
}

function searchControl(){
  const top=$('.med-topbar');if(!top)return;
  if($('.global-search-wrap',top)||$('.v20192-injected-search',top))return;
  const wrap=document.createElement('div');wrap.className='v20192-injected-search';wrap.innerHTML='<i class="bi bi-search"></i><input type="search" aria-label="Search Dictionary" placeholder="Search Dictionary…">';
  const firstAction=$('.med-top-actions,.topbar-actions',top);top.insertBefore(wrap,firstAction||top.children[1]||null);
  const input=$('input',wrap);input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim()){localStorage.setItem('smd-shell-search',input.value.trim());location.href='./app.html#dictionary';}});
}

function selectControl(kind){
  const top=$('.med-topbar');if(!top)return null;
  const selectors=kind==='lang'?['#contentLanguage','#anatomyLanguage','.v20192-lang']:['#themeSelect','#anatomyTheme','.v20192-theme'];
  let sel=selectors.map(s=>$(s,top)).find(Boolean);if(sel)return sel;
  const actions=$('.med-top-actions,.topbar-actions',top)||(()=>{const d=document.createElement('div');d.className='topbar-actions';top.appendChild(d);return d;})();
  sel=document.createElement('select');sel.className=`v20192-top-select v20192-${kind}`;sel.setAttribute('aria-label',kind==='lang'?'Language':'Theme');
  const items=kind==='lang'?LANGS:THEMES;for(const [v,l] of items){const o=document.createElement('option');o.value=v;o.textContent=l;sel.appendChild(o);}if(kind==='lang'&&actions.querySelector('select'))actions.insertBefore(sel,actions.querySelector('select'));else actions.appendChild(sel);
  if(kind==='lang'){
    sel.value=localStorage.getItem('smd-content-lang')||localStorage.getItem('smd-ui-lang')||'en';
    sel.addEventListener('change',()=>{localStorage.setItem('smd-content-lang',sel.value);localStorage.setItem('smd-ui-lang',sel.value);document.documentElement.lang=sel.value;document.documentElement.dir=['ps','prs','fa','ar'].includes(sel.value)?'rtl':'ltr';});
  }else{
    sel.value=localStorage.getItem('smd-theme')||'clinical';
    sel.addEventListener('change',()=>{localStorage.setItem('smd-theme',sel.value);document.body.dataset.theme=sel.value;});
  }
  return sel;
}

function syncTopbar(){
  normalizeMenu();searchControl();
  const lang=selectControl('lang'),theme=selectControl('theme');
  if(lang&&!lang.value)lang.value='en';if(theme&&!theme.value)theme.value='clinical';
}

function normalizeSidebar(){
  $$('.med-sidebar a[href*="clinical-reference"],.med-sidebar .v20-reference-link').forEach(x=>x.remove());
  const side=$('.med-sidebar');if(!side)return;
  if(!$('.v20191-sidebar-collapse',side)){
    const b=document.createElement('button');b.type='button';b.className='v20191-sidebar-collapse';side.querySelector('.med-brand,.sidebar-brand')?.insertAdjacentElement('afterend',b);
    const sync=()=>{const collapsed=document.body.classList.contains('v20191-sidebar-collapsed');b.innerHTML=`<i class="bi ${collapsed?'bi-arrow-right':'bi-arrow-left'}"></i>`;b.title=collapsed?'Expand sidebar':'Collapse sidebar';b.setAttribute('aria-label',b.title);};
    b.addEventListener('click',()=>{document.body.classList.toggle('v20191-sidebar-collapsed');localStorage.setItem('smd-sidebar-collapsed',document.body.classList.contains('v20191-sidebar-collapsed')?'1':'0');sync();});
    if(localStorage.getItem('smd-sidebar-collapsed')==='1'&&!isMobile())document.body.classList.add('v20191-sidebar-collapsed');sync();
  }
}

function normalizeReference(){
  const ref=$('#clinical-reference');if(!ref)return;
  const key='smd-clinical-reference-collapsed';
  if(localStorage.getItem(key)==='1')ref.classList.add('is-collapsed');
  const btn=$('.v20191-reference-toggle',ref);if(btn&&!btn.dataset.v20192Bound){btn.dataset.v20192Bound='1';btn.addEventListener('click',()=>setTimeout(()=>localStorage.setItem(key,ref.classList.contains('is-collapsed')?'1':'0'),0));}
}

function normalizeViewButtons(){
  const grid=$('#termGrid');if(!grid)return;
  const saved=localStorage.getItem('smd-term-view')||(isMobile()?'1':'3');
  if(!grid.classList.contains('cols-1')&&!grid.classList.contains('cols-2')&&!grid.classList.contains('cols-3'))grid.classList.add('cols-'+saved);
  ['1','2','3'].forEach(n=>{const b=$(`#view${n==='1'?'One':n==='2'?'Two':'Three'}Button`);if(b){b.title=`${n} term${n==='1'?'':'s'} per row`;b.setAttribute('aria-label',b.title);}});
}

function repairImages(){
  $$('.term-visual-stage img').forEach(img=>{img.style.objectFit='contain';if(img.dataset.qaFallback)return;img.dataset.qaFallback='1';img.addEventListener('error',()=>{if(img.dataset.qaDone)return;img.dataset.qaDone='1';img.src='./assets/images/medical-3d/heart.svg';});});
}

function syncViewport(){
  const mobile=isMobile();
  const menu=$('.v2018-menu-btn');if(menu){menu.hidden=!mobile;menu.setAttribute('aria-hidden',mobile?'false':'true');}
  if(!mobile)closeDrawer();
  if(mobile)document.body.classList.remove('v20191-sidebar-collapsed');
}

syncTopbar();normalizeSidebar();normalizeReference();normalizeViewButtons();repairImages();syncViewport();
setTimeout(()=>{syncTopbar();normalizeSidebar();repairImages();syncViewport();},120);
setTimeout(()=>{syncTopbar();repairImages();},700);
addEventListener('resize',syncViewport,{passive:true});
const grid=$('#termGrid');if(grid)new MutationObserver(repairImages).observe(grid,{childList:true,subtree:true});
})();
