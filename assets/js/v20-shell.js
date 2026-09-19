(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
if(!document.body.classList.contains('workspace-page'))return;

// Keep one navigation information architecture on every workspace screen.
const nav=$('.med-nav');
if(nav && !$('.med-nav-item[href*="anatomy.html"]',nav)){
  const dictionary=[...nav.querySelectorAll('.med-nav-item')].find(x=>/dictionary/i.test(x.textContent||''));
  const anatomy=document.createElement('a');
  anatomy.className='med-nav-item v20-anatomy-link';
  anatomy.href='./anatomy.html';
  anatomy.innerHTML='<span class="nav-ico"><i class="bi bi-box" aria-hidden="true"></i></span><span>3D Anatomy</span>';
  dictionary?.insertAdjacentElement('afterend',anatomy);
}

const iconMap=[
 ['dashboard','bi-house-door'],['dictionary','bi-journal-medical'],['clinical reference','bi-clipboard2-pulse'],['anatomy','bi-box'],['ai','bi-stars'],
 ['selected','bi-bookmark-check'],['offline','bi-cloud-arrow-down'],['bookmark','bi-bookmark'],
 ['history','bi-clock-history'],['about','bi-info-circle'],['setting','bi-gear'],['admin','bi-grid-1x2']
];
$$('.med-nav-item').forEach(item=>{
 const key=((item.getAttribute('href')||'')+' '+(item.id||'')+' '+item.textContent).toLowerCase();
 const hit=iconMap.find(([k])=>key.includes(k));
 const ico=$('.nav-ico',item); if(hit&&ico)ico.innerHTML=`<i class="bi ${hit[1]}" aria-hidden="true"></i>`;
});

const path=location.pathname.split('/').pop()||'app.html';
$$('.med-nav-item').forEach(x=>{if(x.matches('a'))x.classList.remove('active')});
let active=null;
if(path==='anatomy.html')active=$('.med-nav-item[href*="anatomy"]');
else if(path==='ai.html')active=$('.med-nav-item[href*="ai.html"]');
else if(path==='offline.html')active=$('.med-nav-item[href*="offline"]');
else if(path==='about.html')active=$('.med-nav-item[href*="about"]');
else if(path==='admin.html')active=$('.med-nav-item[href*="admin"]');
else active=$('.med-nav-item[href="#dictionary"]')||$('.med-nav-item[href*="#dictionary"]')||$('.med-nav-item[href*="app.html"]');
active?.classList.add('active');

function openDrawer(){
 document.body.classList.add('v20-drawer-open');
 let b=$('.v20-drawer-backdrop');
 if(!b){b=document.createElement('div');b.className='v20-drawer-backdrop';b.setAttribute('aria-hidden','true');b.onclick=closeDrawer;document.body.appendChild(b);}
}
function closeDrawer(){document.body.classList.remove('v20-drawer-open');$('.v20-drawer-backdrop')?.remove();}

function installCanonicalMobileNav(){
 let mobile=$('.mobile-bottom-nav');
 if(!mobile){mobile=document.createElement('nav');document.body.appendChild(mobile);}
 mobile.className='mobile-bottom-nav v20-mobile-nav';
 mobile.setAttribute('aria-label','Mobile navigation');
 mobile.innerHTML=`
   <a data-v20-mobile="home" href="./app.html#dashboard"><i class="bi bi-house-door"></i><span>Home</span></a>
   <a data-v20-mobile="dictionary" href="./app.html#dictionary"><i class="bi bi-journal-medical"></i><span>Dictionary</span></a>
   <a data-v20-mobile="anatomy" href="./anatomy.html"><i class="bi bi-box"></i><span>3D Anatomy</span></a>
   <a data-v20-mobile="ai" href="./ai.html"><i class="bi bi-stars"></i><span>AI Study</span></a>
   <button data-v20-mobile="more" type="button"><i class="bi bi-grid"></i><span>More</span></button>`;
 const current=path==='anatomy.html'?'anatomy':path==='ai.html'?'ai':path==='app.html'?'dictionary':null;
 if(current)mobile.querySelector(`[data-v20-mobile="${current}"]`)?.classList.add('active');
 mobile.querySelector('[data-v20-mobile="more"]')?.addEventListener('click',openDrawer);
}

if(matchMedia('(max-width:820px)').matches){
 installCanonicalMobileNav();
 const top=$('.med-topbar');
 if(top){top.addEventListener('click',e=>{const r=top.getBoundingClientRect();if(e.clientX-r.left<55&&!e.target.closest('input,select,button,a'))openDrawer();});}
 $$('.med-sidebar a,.med-sidebar button').forEach(el=>el.addEventListener('click',closeDrawer));
}

// Keep shell behavior correct if a device rotates/resizes across the breakpoint.
let mobileState=matchMedia('(max-width:820px)').matches;
addEventListener('resize',()=>{
 const now=matchMedia('(max-width:820px)').matches;
 if(now&&!mobileState)installCanonicalMobileNav();
 if(!now&&mobileState)closeDrawer();
 mobileState=now;
},{passive:true});
})();
