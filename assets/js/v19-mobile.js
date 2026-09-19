(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  function profileMarkup(){
    const src=$('.avatar-dot img')?.src||'';
    return src?`<img src="${src}" alt="">`:'<span>●</span>';
  }
  function setMode(mode){
    document.body.classList.toggle('v19-mobile-dictionary-mode',mode==='dictionary');
    $$('.v19-mobile-nav .active').forEach(x=>x.classList.remove('active'));
    $(`.v19-mobile-nav [data-v19-nav="${mode}"]`)?.classList.add('active');
    if(mode==='dictionary'){$('#heroSearchMirror')?.focus();}
    else $('#heroSearchMirror')?.blur();
    scrollTo({top:0,behavior:'smooth'});
  }
  function workspaceHeader(){
    if(!$('.workspace-page')||$('.v19-mobile-header'))return;
    const header=document.createElement('header');header.className='v19-mobile-header';
    header.innerHTML=`<button class="v19-mobile-menu" type="button" aria-label="Open navigation">☰</button>
      <a class="v19-mobile-brand" href="./app.html"><img src="./assets/images/logo-book.svg" alt=""><span><b>Suhail Medical Dictionary</b><small>Learn today · heal tomorrow</small></span></a>
      <button class="v19-mobile-bell" type="button" aria-label="Notifications">♢<i></i></button>
      <button class="v19-mobile-profile" type="button" aria-label="Account">${profileMarkup()}</button>`;
    $('.med-main')?.prepend(header);
    $('.v19-mobile-menu',header)?.addEventListener('click',()=>$('.mobile-menu-button')?.click());
    $('.v19-mobile-profile',header)?.addEventListener('click',()=>$('#accountButton')?.click());
    $('.v19-mobile-bell',header)?.addEventListener('click',()=>document.querySelector('.v16-bell,.v19-notify')?.click());
  }
  function workspaceNav(){
    const nav=$('.mobile-bottom-nav');if(!nav)return;
    nav.className='mobile-bottom-nav v19-mobile-nav';
    nav.innerHTML=`<button type="button" data-v19-nav="home"><span class="v19-nav-icon">⌂</span><span>Home</span></button>
      <button type="button" data-v19-nav="dictionary"><span class="v19-nav-icon">▣</span><span>Dictionary</span></button>
      <a href="./anatomy.html" data-v19-nav="anatomy"><span class="v19-nav-icon">◇</span><span>3D Anatomy</span></a>
      <a href="./ai.html" data-v19-nav="ai"><span class="v19-nav-icon">✦</span><span>AI Study</span></a>
      <button type="button" data-v19-nav="more"><span class="v19-nav-icon">•••</span><span>More</span></button>`;
    $('[data-v19-nav="home"]',nav)?.addEventListener('click',()=>setMode('home'));
    $('[data-v19-nav="dictionary"]',nav)?.addEventListener('click',()=>setMode('dictionary'));
    $('[data-v19-nav="more"]',nav)?.addEventListener('click',()=>$('.mobile-menu-button')?.click());
    setMode(location.hash==='#dictionary'?'dictionary':'home');
  }
  function syncProfile(){
    const btn=$('.v19-mobile-profile');if(!btn)return;btn.innerHTML=profileMarkup();
  }
  function initWorkspace(){if(!mobile())return;workspaceHeader();workspaceNav();syncProfile();
    const account=$('#accountButton');if(account)new MutationObserver(syncProfile).observe(account,{childList:true,subtree:true,characterData:true});
  }
  function initAnatomy(){
    if(!$('.v19-anatomy-page')||$('.v19-anatomy-bottom-nav'))return;
    const n=document.createElement('nav');n.className='v19-anatomy-bottom-nav';n.setAttribute('aria-label','Mobile navigation');
    n.innerHTML=`<a href="./app.html"><span>⌂</span>Home</a><a href="./app.html#dictionary"><span>▣</span>Dictionary</a><a class="active" href="./anatomy.html"><span>◇</span>3D Anatomy</a><a href="./ai.html" data-ai-link><span>✦</span>AI Study</a><a href="./about.html"><span>•••</span>More</a>`;
    document.body.appendChild(n);
  }
  function init(){initWorkspace();if(mobile())initAnatomy();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  addEventListener('resize',()=>{if(mobile()){initWorkspace();initAnatomy();}} ,{passive:true});
})();
