(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
if(!document.body.classList.contains('workspace-page')) return;

// Normalize legacy legal pages to the same shell without changing their consent logic.
const legacySide=$('.workspace-sidebar');
if(legacySide){legacySide.classList.add('med-sidebar');$('.sidebar-brand',legacySide)?.classList.add('med-brand');const nav=$('.sidebar-nav',legacySide);nav?.classList.add('med-nav');$$('a',nav).forEach(a=>a.classList.add('med-nav-item'));}
$('.workspace-shell')?.classList.add('med-main');
$('.workspace-topbar')?.classList.add('med-topbar');
$('.workspace-main')?.classList.add('med-content');

// Clinical Reference is inside Dictionary, never a separate sidebar destination.
$$('.med-sidebar a[href*="clinical-reference"],.med-sidebar .v20-reference-link').forEach(a=>a.remove());

// Desktop collapse/expand control with clear left/right arrow state.
const side=$('.med-sidebar');
if(side && !$('.v20191-sidebar-collapse',side)){
  const b=document.createElement('button');b.type='button';b.className='v20191-sidebar-collapse';b.setAttribute('aria-label','Collapse sidebar');b.title='Collapse sidebar';
  const sync=()=>{const c=document.body.classList.contains('v20191-sidebar-collapsed');b.innerHTML=`<i class="bi ${c?'bi-arrow-right':'bi-arrow-left'}"></i>`;b.setAttribute('aria-label',c?'Expand sidebar':'Collapse sidebar');b.title=c?'Expand sidebar':'Collapse sidebar';};
  b.onclick=()=>{document.body.classList.toggle('v20191-sidebar-collapsed');localStorage.setItem('smd-sidebar-collapsed',document.body.classList.contains('v20191-sidebar-collapsed')?'1':'0');sync();};
  side.querySelector('.med-brand,.sidebar-brand')?.insertAdjacentElement('afterend',b);
  if(localStorage.getItem('smd-sidebar-collapsed')==='1'&&innerWidth>820)document.body.classList.add('v20191-sidebar-collapsed');sync();
}

// Ensure exactly one mobile menu button.
function normalizeMobileMenu(){
 const top=$('.med-topbar');if(!top)return;
 $$('.v20-mobile-menu-button',top).forEach(x=>x.remove());
 const buttons=$$('.v2018-menu-btn',top);buttons.slice(1).forEach(x=>x.remove());
 let b=buttons[0];if(!b){b=document.createElement('button');b.type='button';b.className='v2018-menu-btn';b.setAttribute('aria-label','Open navigation');b.innerHTML='<i class="bi bi-list"></i>';top.prepend(b);}
 b.onclick=()=>{document.body.classList.add('v20-drawer-open');let d=$('.v20-drawer-backdrop');if(!d){d=document.createElement('div');d.className='v20-drawer-backdrop';d.onclick=()=>{document.body.classList.remove('v20-drawer-open');d.remove();};document.body.appendChild(d);}};
}
normalizeMobileMenu();setTimeout(normalizeMobileMenu,80);setTimeout(normalizeMobileMenu,500);

// Pages without their own search get one small dictionary search in the same mobile topbar.
const top=$('.med-topbar');
if(top&&!$('.global-search-wrap',top)){
  const wrap=document.createElement('div');wrap.className='global-search-wrap v20191-mobile-search';wrap.innerHTML='<span class="search-glyph"><i class="bi bi-search"></i></span><input class="global-search" aria-label="Search Dictionary" placeholder="Search Dictionary…">';top.insertBefore(wrap,top.children[1]||null);
  const input=$('input',wrap);input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim()){localStorage.setItem('smd-shell-search',input.value.trim());location.href='./app.html#dictionary';}});
}

// Pending shell search handed off from another page.
if(location.pathname.endsWith('/app.html')||location.pathname.endsWith('app.html')){
 const pending=localStorage.getItem('smd-shell-search');if(pending){localStorage.removeItem('smd-shell-search');setTimeout(()=>{const input=$('#searchInput');if(input){input.value=pending;input.dispatchEvent(new Event('input',{bubbles:true}));}},450);}
}

// Dictionary Clinical Reference collapse toggle.
const ref=$('#clinical-reference');
if(ref){const head=$('.v20-reference-head',ref);if(head&&!$('.v20191-reference-toggle',head)){const b=document.createElement('button');b.type='button';b.className='v20191-reference-toggle';b.setAttribute('aria-label','Collapse Clinical Reference');b.innerHTML='<i class="bi bi-chevron-down"></i>';head.appendChild(b);b.onclick=()=>{ref.classList.toggle('is-collapsed');b.setAttribute('aria-label',ref.classList.contains('is-collapsed')?'Expand Clinical Reference':'Collapse Clinical Reference');};}}
})();
