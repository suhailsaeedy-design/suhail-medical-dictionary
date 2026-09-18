(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const DARK_THEMES=new Set(['dark','ocean']);
function isDark(){return DARK_THEMES.has(document.body.dataset.theme);}
function updateVisualTheme(){
  const theme=isDark()?'dark':'light';
  $$('[data-v12-asset]').forEach(img=>{
    const asset=img.dataset.v12Asset;
    if(!asset)return;
    const next=`./assets/images/v12/${asset}-${theme}.webp`;
    if(!img.src.endsWith(`/${asset}-${theme}.webp`)) img.src=next;
  });
}
function watchTheme(){
  new MutationObserver(updateVisualTheme).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
  $('#themeSelect')?.addEventListener('change',()=>setTimeout(updateVisualTheme,0));
  $('#settingsTheme')?.addEventListener('change',()=>setTimeout(updateVisualTheme,0));
  updateVisualTheme();
}
function addNotification(){
  const actions=$('.med-top-actions'); if(!actions||$('.v12-notify',actions))return;
  const account=$('.account-wrap',actions)||$('.med-account',actions);
  const b=document.createElement('button'); b.type='button';b.className='v12-notify';b.setAttribute('aria-label','Notifications');b.title='Notifications';b.textContent='♟';
  // clean bell shape without an external icon
  b.innerHTML='<span aria-hidden="true">🔔</span>';
  b.addEventListener('click',()=>{
    let p=$('.v12-notification-pop');
    if(p){p.remove();return;}
    p=document.createElement('div');p.className='v12-notification-pop';p.innerHTML='<strong>Study notifications</strong><p>Your dictionary, selected terms, and saved study data are ready.</p><button type="button">Close</button>';
    actions.appendChild(p);p.querySelector('button').onclick=()=>p.remove();
    setTimeout(()=>document.addEventListener('click',e=>{if(!p.contains(e.target)&&e.target!==b)p.remove();},{once:true}),0);
  });
  if(account)actions.insertBefore(b,account);else actions.appendChild(b);
}
function addAdvancedFilter(){
  const row=$('.med-search-row'); if(!row||$('.v12-advanced-filter',row))return;
  const b=document.createElement('button');b.type='button';b.className='v12-advanced-filter';b.innerHTML='☷&nbsp; Advanced Filters';
  b.setAttribute('aria-expanded','true');
  b.onclick=()=>{const chips=$('#categoryChipRow');if(!chips)return;const hidden=chips.classList.toggle('v12-filter-hidden');b.setAttribute('aria-expanded',String(!hidden));b.innerHTML=hidden?'☷&nbsp; Show Filters':'☷&nbsp; Advanced Filters';};
  row.appendChild(b);
}
function add3DToggle(){
  const controls=$('.results-controls');if(!controls||$('.v12-3d-toggle',controls))return;
  const b=document.createElement('button');b.type='button';b.className='v12-3d-toggle';b.innerHTML='3D View <span aria-hidden="true"></span>';
  const pref=localStorage.getItem('smd-3d-view')!=='off';b.classList.toggle('active',pref);document.body.classList.toggle('v12-no-3d',!pref);
  b.onclick=()=>{const on=!b.classList.contains('active');b.classList.toggle('active',on);document.body.classList.toggle('v12-no-3d',!on);localStorage.setItem('smd-3d-view',on?'on':'off');};
  const firstView=$('#gridViewButton');controls.insertBefore(b,firstView||controls.firstChild);
}
function addSideQuote(){
 const side=$('.med-sidebar');if(!side||$('.v12-side-quote',side))return;
 const q=document.createElement('div');q.className='v12-side-quote';q.innerHTML='<span>“</span><p>Knowledge heals beyond boundaries.</p>';
 side.appendChild(q);
}
function accountPolish(){
 const btn=$('#accountButton'); if(!btn)return;
 btn.addEventListener('click',()=>btn.classList.toggle('v12-open'));
 document.addEventListener('click',e=>{if(!e.target.closest('.account-wrap'))btn.classList.remove('v12-open')});
}
function makeDetailMobileFriendly(){
 document.addEventListener('click',e=>{
   if(innerWidth>1050)return;
   if(e.target.closest('.term-card')&&!e.target.closest('.term-check,.term-bookmark,.term-visual'))setTimeout(()=>$('#detailPanel')?.classList.add('open'),30);
 });
}
function makeCardsInteractive(){
 document.addEventListener('pointermove',e=>{
   const card=e.target.closest?.('.term-card');if(!card||innerWidth<1050||document.body.classList.contains('v12-no-3d'))return;
   const r=card.getBoundingClientRect();
   card.style.setProperty('--tilt-y',(((e.clientX-r.left)/r.width-.5)*5).toFixed(2)+'deg');
   card.style.setProperty('--tilt-x',(-((e.clientY-r.top)/r.height-.5)*4).toFixed(2)+'deg');
 });
 document.addEventListener('pointerout',e=>{const c=e.target.closest?.('.term-card');if(c&&!c.contains(e.relatedTarget)){c.style.removeProperty('--tilt-x');c.style.removeProperty('--tilt-y');}});
}
function mobileBrand(){
 const sidebar=$('.med-sidebar');if(sidebar){const mark=$('.med-brand-mark img',sidebar);if(mark)mark.setAttribute('draggable','false');}
 const bar=$('.med-topbar');if(bar&&!$('.v12-mobile-logo',bar)){
   const a=document.createElement('a');a.className='v12-mobile-logo';a.href='./app.html';a.innerHTML='<img src="./assets/images/logo-book.svg" alt=""><span>Suhail</span>';
   const search=$('.global-search-wrap',bar);bar.insertBefore(a,search);
 }
}
function setup(){watchTheme();addNotification();addAdvancedFilter();add3DToggle();addSideQuote();accountPolish();makeDetailMobileFriendly();makeCardsInteractive();mobileBrand();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
