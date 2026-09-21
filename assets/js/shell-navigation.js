(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const page=()=>location.pathname.split('/').pop()||'app.html';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const tr=s=>window.SMD21I18N?.translateExact?.(s)||s;
  const account=()=>window.SMD21Auth?.getAccount?.()||{email:'Local account',provider:'local'};
  function activeKey(){
    const p=page(),h=(location.hash||'').replace('#','');
    if(p==='anatomy.html')return'anatomy';
    if(p==='ai.html')return'ai';
    if(p==='app.html'){if(!h||h==='home')return'home';return'dictionary';}
    return'more';
  }
  function navItem(key,href,icon,label,isButton=false){
    const active=activeKey()===key,tag=isButton?'button':'a';
    const hrefAttr=isButton?'type="button" data-shell-more aria-haspopup="dialog" aria-expanded="false"':'href="'+href+'"';
    return `<${tag} ${hrefAttr} data-shell-key="${key}"${active?' class="active" aria-current="page"':''}><span class="shell-nav-icon" aria-hidden="true">${icon}</span><span class="shell-nav-label">${esc(label)}</span></${tag}>`;
  }
  function renderBottomNav(){
    document.querySelectorAll('nav.bottom-nav').forEach(nav=>{
      nav.classList.add('shell-bottom-nav');
      nav.innerHTML=[
        navItem('home','app.html#home','⌂','Home'),
        navItem('dictionary','app.html#dictionary','▣','Dictionary'),
        navItem('anatomy','anatomy.html','◈','3D Anatomy'),
        navItem('ai','ai.html','✦','AI Study'),
        navItem('more','', '•••','More',true)
      ].join('');window.SMD21I18N?.translateTree?.(nav);
    });
  }
  function accountSummary(){const a=account(),email=a.email||'Local account',provider=a.provider||'local';return `<div class="shell-account-summary"><span class="avatar">${esc(email.slice(0,1).toUpperCase()||'S')}</span><span><strong>${esc(email)}</strong><small>${esc(provider==='google'?'Google / Supabase session':'Local browser account')}</small></span></div>`}
  function makeMoreSheet(){
    if($('#shellMoreSheet'))return;
    const back=document.createElement('div');back.className='shell-more-backdrop';back.id='shellMoreBackdrop';
    const sheet=document.createElement('section');sheet.className='shell-more-sheet';sheet.id='shellMoreSheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','More navigation');sheet.innerHTML=`<div class="shell-more-head"><strong>More</strong><button class="btn-ui shell-more-close" type="button" data-shell-more-close aria-label="Close">×</button></div>${accountSummary()}<div class="shell-more-grid"><a href="app.html#selected">✓ Selected</a><a href="app.html#bookmarks">☆ Bookmarks</a><a href="app.html#history">◷ History</a><a href="offline.html">⇩ Offline Packs</a><a href="settings.html">⚙ Settings</a><a href="about.html">ⓘ About</a><a href="settings.html#backupRestore">↥ Backup & restore</a><button type="button" class="shell-danger" data-shell-signout>↪ Sign out</button></div>`;
    document.body.append(back,sheet);window.SMD21I18N?.translateTree?.(sheet);
  }
  function openMore(open=true){const s=$('#shellMoreSheet'),b=$('#shellMoreBackdrop');if(!s||!b)return;s.classList.toggle('open',open);b.classList.toggle('show',open);document.querySelectorAll('[data-shell-more]').forEach(x=>x.setAttribute('aria-expanded',String(open)));if(open)s.querySelector('[data-shell-more-close]')?.focus();}

  function makeSidebarLogout(){
    document.querySelectorAll('.app-sidebar .sidebar-nav').forEach(nav=>{
      if(nav.querySelector('[data-shell-sidebar-signout]'))return;
      const divider=document.createElement('div');divider.className='nav-spacer';divider.dataset.shellLogoutDivider='';
      const btn=document.createElement('button');btn.type='button';btn.className='nav-btn shell-sidebar-signout';btn.dataset.shellSignout='';btn.dataset.shellSidebarSignout='';btn.innerHTML='<span aria-hidden="true">↪</span><span>Sign out</span>';
      nav.append(divider,btn);window.SMD21I18N?.translateTree?.(btn);
    });
  }

  function makeAccountMenu(){
    const chip=$('#signOutBtn');if(!chip||$('#shellAccountMenu'))return;
    chip.title=tr('Account');chip.setAttribute('aria-haspopup','menu');chip.setAttribute('aria-expanded','false');const small=chip.querySelector('small');if(small)small.textContent=tr('Medical learner · Account');
    const menu=document.createElement('div');menu.className='account-menu';menu.id='shellAccountMenu';menu.setAttribute('role','menu');menu.innerHTML=`${accountSummary()}<a role="menuitem" href="settings.html">⚙ Settings</a><a role="menuitem" href="settings.html#backupRestore">↥ Backup & restore</a><a role="menuitem" href="about.html">ⓘ About</a><button role="menuitem" type="button" class="shell-danger" data-shell-signout>↪ Sign out</button>`;document.body.append(menu);window.SMD21I18N?.translateTree?.(menu);
    chip.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const open=!menu.classList.contains('open');menu.classList.toggle('open',open);chip.setAttribute('aria-expanded',String(open));},{capture:true});
  }
  async function signOut(){try{await window.SMD21Auth?.signOut?.()}finally{location.href='index.html'}}
  function closeAccount(){const menu=$('#shellAccountMenu'),chip=$('#signOutBtn');menu?.classList.remove('open');chip?.setAttribute('aria-expanded','false')}
  function bind(){
    document.addEventListener('click',e=>{
      if(e.target.closest('[data-shell-more]')){e.preventDefault();openMore(true);return;}
      if(e.target.closest('[data-shell-more-close]')||e.target.id==='shellMoreBackdrop'){e.preventDefault();openMore(false);return;}
      if(e.target.closest('[data-shell-signout]')){e.preventDefault();signOut();return;}
      const menu=$('#shellAccountMenu'),chip=$('#signOutBtn');if(menu?.classList.contains('open')&&!menu.contains(e.target)&&!chip?.contains(e.target))closeAccount();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){openMore(false);closeAccount();}});
    window.addEventListener('hashchange',renderBottomNav);
    window.addEventListener('smd21:languagechange',()=>{renderBottomNav();const chip=$('#signOutBtn');if(chip){chip.title=tr('Account');const small=chip.querySelector('small');if(small)small.textContent=tr('Medical learner · Account');}});
  }
  document.addEventListener('DOMContentLoaded',()=>{renderBottomNav();makeMoreSheet();makeSidebarLogout();makeAccountMenu();bind();});
  window.SMD21ShellNavigation={renderBottomNav,openMore,activeKey};
})();
