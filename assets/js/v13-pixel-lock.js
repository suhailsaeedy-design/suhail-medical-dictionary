(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const isMobile=()=>innerWidth<=700;const dark=()=>['dark','ocean'].includes(document.body.dataset.theme);
let skin,controls,drawer,drawerBack,detailMobile;
function imageFor(kind){
  if(kind==='desktop')return `./assets/reference-pixel/desktop-${dark()?'dark':'light'}.png`;
  if(kind==='mobile-home')return `./assets/reference-pixel/mobile-${dark()?'dark':'light'}-home.png`;
  if(kind==='mobile-drawer')return `./assets/reference-pixel/mobile-${dark()?'dark':'light'}-drawer.png`;
  if(kind==='mobile-detail')return `./assets/reference-pixel/mobile-${dark()?'dark':'light'}-detail.png`;
  return '';
}
function setSkin(){if(!skin)return;skin.style.backgroundImage=`url("${imageFor(isMobile()?'mobile-home':'desktop')}")`;if(drawer)drawer.style.backgroundImage=`url("${imageFor('mobile-drawer')}")`;if(detailMobile)detailMobile.style.backgroundImage=`url("${imageFor('mobile-detail')}")`;}
function live(reason){document.body.classList.add('pixel-live');try{sessionStorage.setItem('smd-pixel-live',reason||'1')}catch{}}
function clickId(id){live(id);setTimeout(()=>document.getElementById(id)?.click(),30)}
function addHit(cls,handler,parent=controls){const b=document.createElement('button');b.type='button';b.className=`pixel-hit ${cls}`;b.setAttribute('aria-label',cls.replace(/^px-/,'').replace(/-/g,' '));b.onclick=e=>{e.preventDefault();handler?.(e)};parent.appendChild(b);return b;}
function makeDesktop(){
  const search=document.createElement('input');search.className='pixel-input pixel-desktop-only px-global-search';search.setAttribute('aria-label','Search medical dictionary');controls.appendChild(search);search.addEventListener('input',()=>{const t=$('#searchInput');if(t){t.value=search.value;t.dispatchEvent(new Event('input',{bubbles:true}))}if(search.value.trim())live('search')});
  const mainSearch=document.createElement('input');mainSearch.className='pixel-input pixel-desktop-only px-search-main';mainSearch.setAttribute('aria-label','Search medical terms');controls.appendChild(mainSearch);mainSearch.addEventListener('input',()=>{const t=$('#searchInput');if(t){t.value=mainSearch.value;t.dispatchEvent(new Event('input',{bubbles:true}))}if(mainSearch.value.trim())live('search')});
  const lang=document.createElement('select');lang.className='pixel-select pixel-desktop-only px-language';lang.innerHTML='<option value="en">English</option><option value="ps">پښتو</option><option value="prs">دري</option><option value="fa">فارسی</option><option value="tr">Türkçe</option><option value="ar">العربية</option><option value="zh">中文</option>';controls.appendChild(lang);lang.value=$('#contentLanguage')?.value||'en';lang.onchange=()=>{const s=$('#contentLanguage');if(s){s.value=lang.value;s.dispatchEvent(new Event('change',{bubbles:true}))}live('language')};
  const th=document.createElement('select');th.className='pixel-select pixel-desktop-only px-theme';th.innerHTML='<option value="clinical">Light</option><option value="dark">Dark</option><option value="ocean">Blue</option>';controls.appendChild(th);th.value=document.body.dataset.theme||'clinical';th.onchange=()=>{document.body.dataset.theme=th.value;localStorage.setItem('smd-theme',th.value);const s=$('#themeSelect');if(s){s.value=th.value;s.dispatchEvent(new Event('change',{bubbles:true}))}setSkin()};
  addHit('pixel-desktop-only px-account',()=>togglePixelAccount());
  addHit('pixel-desktop-only px-nav-dashboard',()=>{live('dashboard');location.hash='dashboard'});
  addHit('pixel-desktop-only px-nav-dictionary',()=>{});
  addHit('pixel-desktop-only px-nav-ai',()=>location.href='./ai.html');
  addHit('pixel-desktop-only px-nav-selected',()=>clickId('selectedButton'));
  addHit('pixel-desktop-only px-nav-offline',()=>location.href='./offline.html');
  addHit('pixel-desktop-only px-nav-bookmarks',()=>clickId('bookmarksButton'));
  addHit('pixel-desktop-only px-nav-history',()=>clickId('historyButton'));
  addHit('pixel-desktop-only px-nav-about',()=>location.href='./about.html');
  addHit('pixel-desktop-only px-nav-settings',()=>clickId('settingsButton'));
  addHit('pixel-desktop-only px-side-tools-open',()=>location.href='./ai.html');
  addHit('pixel-desktop-only px-advanced-filter',()=>{live('filters');setTimeout(()=>$('.v12-advanced-filter')?.click(),20)});
  addHit('pixel-desktop-only px-select-all',()=>clickId('selectAllFiltered'));
  for(let i=0;i<8;i++)addHit(`pixel-desktop-only pixel-card-hit px-card-${i}`,()=>{const cards=$$('.term-card');if(cards[i]){live('term');setTimeout(()=>cards[i].click(),40)}else live('term')});
  addHit('pixel-desktop-only px-detail-ai',()=>{live('ai');setTimeout(()=>$('#detailPanel .detail-actions .primary')?.click(),30)});
  addHit('pixel-desktop-only px-detail-pdf',()=>{live('pdf');setTimeout(()=>$('#detailPanel button')?.click(),30)});
  addHit('pixel-desktop-only px-detail-print',()=>{live('print');setTimeout(()=>{const bs=$$('#detailPanel button');(bs.find(b=>/print/i.test(b.textContent))||$('#printSelected'))?.click()},30)});
  addHit('pixel-desktop-only px-detail-selected',()=>{live('selected');setTimeout(()=>{const bs=$$('#detailPanel button');(bs.find(b=>/selected|remove/i.test(b.textContent))||$('#selectedButton'))?.click()},30)});
  addHit('pixel-desktop-only px-detail-offline',()=>clickId('downloadOfflineButton'));
}
function makeMobile(){
 addHit('pixel-mobile-only px-mobile-menu',()=>openDrawer());
 addHit('pixel-mobile-only px-mobile-account',()=>clickId('accountButton'));
 addHit('pixel-mobile-only px-mobile-lang',()=>live('language'));
 const s=document.createElement('input');s.className='pixel-input pixel-mobile-only px-mobile-search';s.setAttribute('aria-label','Search medical terms');controls.appendChild(s);s.oninput=()=>{const x=$('#searchInput');if(x){x.value=s.value;x.dispatchEvent(new Event('input',{bubbles:true}))}if(s.value.trim())live('search')};
 for(let i=0;i<4;i++)addHit(`pixel-mobile-only pixel-card-hit px-mobile-card-${i}`,()=>openDetail(i));
 addHit('pixel-mobile-only px-mobile-nav-home',()=>{});addHit('pixel-mobile-only px-mobile-nav-ai',()=>location.href='./ai.html');addHit('pixel-mobile-only px-mobile-nav-selected',()=>clickId('selectedButton'));addHit('pixel-mobile-only px-mobile-nav-more',()=>openDrawer());
 drawerBack=document.createElement('div');drawerBack.className='pixel-drawer-backdrop';drawerBack.onclick=closeDrawer;document.body.appendChild(drawerBack);
 drawer=document.createElement('div');drawer.className='pixel-drawer';document.body.appendChild(drawer);
 addHit('d-dashboard',()=>{closeDrawer();live('dashboard')},drawer);addHit('d-dictionary',closeDrawer,drawer);addHit('d-ai',()=>location.href='./ai.html',drawer);addHit('d-selected',()=>{closeDrawer();clickId('selectedButton')},drawer);addHit('d-bookmarks',()=>{closeDrawer();clickId('bookmarksButton')},drawer);addHit('d-history',()=>{closeDrawer();clickId('historyButton')},drawer);addHit('d-offline',()=>location.href='./offline.html',drawer);addHit('d-settings',()=>{closeDrawer();clickId('settingsButton')},drawer);addHit('d-about',()=>location.href='./about.html',drawer);
 detailMobile=document.createElement('div');detailMobile.className='pixel-detail-mobile';document.body.appendChild(detailMobile);addHit('m-close',()=>detailMobile.classList.remove('open'),detailMobile);addHit('m-ai',()=>location.href='./ai.html',detailMobile);addHit('m-pdf',()=>{detailMobile.classList.remove('open');live('pdf')},detailMobile);
}
function openDrawer(){drawer?.classList.add('open');drawerBack?.classList.add('open')}
function closeDrawer(){drawer?.classList.remove('open');drawerBack?.classList.remove('open')}
function openDetail(i){
  const cards=$$('.term-card');if(cards[i]){try{cards[i].click()}catch{}}
  if(i===0&&detailMobile){detailMobile.classList.add('open');setSkin()}else live('detail')
}
function togglePixelAccount(){
 let m=document.querySelector('.pixel-account-menu');
 if(m){m.remove();return;}
 m=document.createElement('div');m.className='pixel-account-menu';
 const src=document.querySelector('#accountButton .account-lines b');const name=src?.textContent||'Account';
 m.innerHTML=`<div class="pam-user"><b>${name}</b><small>Medical Learner</small></div><button type="button" data-switch>Use another Google account</button><button type="button" data-out>Sign out</button>`;
 controls.appendChild(m);
 m.querySelector('[data-switch]').onclick=()=>{live('switch-account');setTimeout(()=>document.getElementById('switchAccountButton')?.click(),20)};
 m.querySelector('[data-out]').onclick=()=>{live('signout');setTimeout(()=>document.getElementById('signOutButton')?.click(),20)};
 setTimeout(()=>document.addEventListener('click',e=>{if(!e.target.closest('.pixel-account-menu')&&!e.target.closest('.px-account'))m?.remove()},{once:true}),10);
}
function droplets(){
 let last=0;document.addEventListener('pointermove',e=>{if(isMobile()||document.body.classList.contains('pixel-live'))return;const now=performance.now();if(now-last<58)return;last=now;const d=document.createElement('i');d.className='pixel-water-dot';d.style.left=(e.clientX-3)+'px';d.style.top=(e.clientY-3)+'px';d.style.setProperty('--dx',`${(Math.random()-.5)*24}px`);d.style.setProperty('--dy',`${8+Math.random()*24}px`);document.body.appendChild(d);setTimeout(()=>d.remove(),700)});
 document.addEventListener('pointerdown',e=>{if(!isMobile()||document.body.classList.contains('pixel-live'))return;const r=document.createElement('span');r.className='touch-ripple';r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),700)},{passive:true});
}
function bootCore(){
 if(new URLSearchParams(location.search).get('live')==='1'){document.body.classList.add('pixel-live');return}
 // The exact artwork is a reference skin, not a replacement for the live app. Auth still gates the page.
 skin=document.createElement('div');skin.className='pixel-skin';document.body.appendChild(skin);
 controls=document.createElement('div');controls.className='pixel-controls';document.body.appendChild(controls);
 makeDesktop();makeMobile();
 if(!isMobile()){
  const acc=document.createElement('div');acc.className='pixel-account-overlay';acc.innerHTML='<span class="pa-avatar">●</span><span class="pa-lines"><b>Account</b><small>Medical Learner</small></span><span class="pa-caret">⌄</span>';controls.appendChild(acc);
  const tools=document.createElement('div');tools.className='pixel-side-tools';tools.innerHTML='<strong>Advanced Study Tools</strong><ul><li>Private study chats</li><li>Offline packs</li><li>PDF & print tools</li><li>Advanced filters</li></ul><div class="pst-btn">Open Study Tools →</div>';controls.appendChild(tools);
  const syncAccount=()=>{const b=document.querySelector('#accountButton .account-lines b');if(b)acc.querySelector('b').textContent=b.textContent||'Account';};syncAccount();setTimeout(syncAccount,500);setTimeout(syncAccount,1600);
 }
 const hint=document.createElement('div');hint.className='pixel-hint';hint.textContent='Interactive reference view';document.body.appendChild(hint);
 setSkin();droplets();document.body.classList.add('pixel-lock-ready');
 new MutationObserver(setSkin).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
 addEventListener('resize',setSkin,{passive:true});
 // If the app is still waiting for auth, keep the reference skin hidden until the workspace is available.
 const loader=$('#sessionLoader');if(loader&&!loader.classList.contains('hidden')){const mo=new MutationObserver(()=>{if(loader.classList.contains('hidden')||getComputedStyle(loader).display==='none')setSkin()});mo.observe(loader,{attributes:true,attributeFilter:['class','style']});}
}
function boot(){
  if(!document.body.classList.contains('auth-pending')){bootCore();return}
  let tries=0;const t=setInterval(()=>{tries++;if(!document.body.classList.contains('auth-pending')){clearInterval(t);bootCore()}else if(tries>120){clearInterval(t)}},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
