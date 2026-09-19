(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const icon=(name)=>{
    const d={
      home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h5v-6h3v6h5v-9.5"/>',
      book:'<path d="M4 5.5c3.4-.8 5.9-.2 8 1.6v13c-2.1-1.8-4.6-2.4-8-1.6z"/><path d="M20 5.5c-3.4-.8-5.9-.2-8 1.6v13c2.1-1.8 4.6-2.4 8-1.6z"/>',
      spark:'<path d="m12 2 1.4 4.2L18 8l-4.6 1.8L12 14l-1.4-4.2L6 8l4.6-1.8z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/>',
      selected:'<path d="M12 3 20 10.5 12 21 4 10.5z"/>',
      download:'<path d="M12 3v12"/><path d="m7.5 11 4.5 4.5 4.5-4.5"/><path d="M5 20h14"/>',
      bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
      info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13.5V10.5l-2-.8a7.6 7.6 0 0 0-.8-1.9l.8-2-2.1-2.1-2 .8a7.6 7.6 0 0 0-1.9-.8L10.5 2h-3L6.7 4a7.6 7.6 0 0 0-1.9.8l-2-.8L.7 6.1l.8 2a7.6 7.6 0 0 0-.8 1.9L-1 10.5v3l2 .8a7.6 7.6 0 0 0 .8 1.9l-.8 2 2.1 2.1 2-.8a7.6 7.6 0 0 0 1.9.8l.8 2h3l.8-2a7.6 7.6 0 0 0 1.9-.8l2 .8 2.1-2.1-.8-2a7.6 7.6 0 0 0 .8-1.9z" transform="translate(2) scale(.83)"/>',
      search:'<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
      bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
      close:'<path d="m6 6 12 12M18 6 6 18"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${d[name]||d.spark}</svg>`;
  };
  function installIcons(){
    const names=['home','book','spark','selected','download','bookmark','clock','info','settings'];
    $$('.med-nav-item .nav-ico').forEach((n,i)=>n.innerHTML=icon(names[i]||'spark'));
  }
  function decorateHero(){
    const art=$('.hero-art'); if(!art || art.dataset.v16Decorated) return;
    art.dataset.v16Decorated='1';
    const books=document.createElement('img');books.className='hero-books';books.src='./assets/images/medical-3d/hero-books.svg';books.alt='';art.appendChild(books);
    const dna=document.createElement('img');dna.className='hero-dna';dna.src='./assets/images/medical-3d/dna.svg';dna.alt='';art.appendChild(dna);
  }
  function mobileDrawer(){
    const top=$('.med-topbar'),side=$('.med-sidebar'); if(!top||!side||$('.mobile-menu-button'))return;
    const b=document.createElement('button');b.type='button';b.className='mobile-menu-button';b.setAttribute('aria-label','Open navigation');b.innerHTML=icon('menu');top.insertBefore(b,top.firstChild);
    if(!$('.drawer-close',side)){
      const x=document.createElement('button');x.type='button';x.className='drawer-close';x.setAttribute('aria-label','Close navigation');x.innerHTML=icon('close');side.appendChild(x);
    }
    if(!$('.mobile-drawer-profile',side)){
      const profile=document.createElement('div');profile.className='mobile-drawer-profile';profile.innerHTML='<span class="drawer-avatar">●</span><span><strong>Medical Learner</strong><small>Google account</small></span><b aria-hidden="true">›</b>';
      const brand=$('.med-brand',side);brand?.insertAdjacentElement('afterend',profile);
    }
    const syncProfile=()=>{
      const profile=$('.mobile-drawer-profile',side);if(!profile)return;
      const accountName=$('#accountMenuName')?.textContent?.trim()||$('.account-lines b')?.textContent?.trim()||'Medical Learner';
      const accountEmail=$('#accountMenuEmail')?.textContent?.trim()||'Google account';
      const strong=$('strong',profile),small=$('small',profile);if(strong)strong.textContent=accountName;if(small)small.textContent=accountEmail==='Google account'?'Medical Learner':accountEmail;
      const src=$('.avatar-dot img')?.getAttribute('src');const avatar=$('.drawer-avatar',profile);if(src&&avatar&&!avatar.querySelector('img')){avatar.textContent='';const im=document.createElement('img');im.src=src;im.alt='';avatar.appendChild(im)}
    };
    let backdrop;
    const close=()=>{side.classList.remove('open');backdrop?.remove();backdrop=null;document.body.classList.remove('sidebar-open');b.innerHTML=icon('menu');b.setAttribute('aria-label','Open navigation')};
    const open=()=>{syncProfile();side.classList.add('open');document.body.classList.add('sidebar-open');backdrop=document.createElement('div');backdrop.className='sidebar-backdrop';backdrop.addEventListener('click',close);document.body.appendChild(backdrop);b.innerHTML=icon('close');b.setAttribute('aria-label','Close navigation')};
    b.addEventListener('click',()=>side.classList.contains('open')?close():open());
    $('.drawer-close',side)?.addEventListener('click',close);
    $$('.med-nav-item',side).forEach(x=>x.addEventListener('click',()=>{if(innerWidth<=820)close()}));
    addEventListener('resize',()=>{if(innerWidth>820)close()});
  }
  function bell(){
    const actions=$('.med-top-actions');if(!actions||$('.v16-bell'))return;
    const b=document.createElement('button');b.type='button';b.className='v16-bell';b.title='Notifications';b.setAttribute('aria-label','Notifications');b.innerHTML=icon('bell')+'<i></i>';
    const account=$('.account-wrap,.med-account',actions);actions.insertBefore(b,account||null);
    let pop=null;
    const close=()=>{pop?.remove();pop=null};
    b.addEventListener('click',e=>{e.stopPropagation();if(pop){close();return}pop=document.createElement('div');pop.className='v16-notification-popover';pop.innerHTML='<strong>Study workspace</strong><p>Your dictionary, saved selections, offline packs, and account tools are ready.</p><a href="./offline.html">Offline packs</a><a href="./about.html">About this project</a>';document.body.appendChild(pop);const r=b.getBoundingClientRect();pop.style.top=(r.bottom+8)+'px';pop.style.right=Math.max(10,innerWidth-r.right)+'px';setTimeout(()=>document.addEventListener('click',close,{once:true}),0)});
  }
  function add3DControl(){
    const controls=$('.results-controls');if(!controls||$('#v16ThreeD'))return;
    const wrap=document.createElement('label');wrap.className='v16-3d-toggle';wrap.innerHTML='<span>3D View</span><input id="v16ThreeD" type="checkbox" checked><i></i>';
    controls.insertBefore(wrap,controls.firstChild);
    const apply=()=>document.body.classList.toggle('reduce-3d',!wrap.querySelector('input').checked);
    wrap.querySelector('input').addEventListener('change',apply);apply();
  }
  function sidePromo(){
    const p=$('.med-side-promo:not(.ai-side-card)');if(!p)return;
    const strong=$('strong',p),small=$('small',p),a=$('a',p);
    if(strong)strong.textContent='Suhail Premium';
    if(small)small.innerHTML='✓ Advanced study tools<br>✓ Offline packs<br>✓ Advanced filters<br>✓ Multi-device study';
    if(a){a.textContent='Explore Study Tools →';a.href='./ai.html'}
  }

  function studyBot(){
    const bot=$('.study-bot');if(!bot)return;bot.innerHTML='<img src="./assets/images/v16/robot-light.webp" alt="" aria-hidden="true">';
    const sync=()=>{const img=$('img',bot);if(img)img.src=`./assets/images/v16/robot-${['dark','ocean'].includes(document.body.dataset.theme)?'dark':'light'}.webp`};
    sync();new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
  }

  function themeLabels(){
    const labels={clinical:'☀ Light',dark:'☾ Dark',ocean:'◉ Blue',forest:'❖ Emerald',violet:'✦ Violet',sand:'◇ Pearl'};
    $$('#themeSelect option,#settingsTheme option').forEach(o=>{if(labels[o.value])o.textContent=labels[o.value]});
  }
  function waterCursor(){
    if(matchMedia('(pointer:coarse)').matches)return;
    let last=0;
    addEventListener('pointermove',e=>{
      const now=performance.now();if(now-last<42)return;last=now;
      if(Math.random()>.78)return;
      const d=document.createElement('i');d.className='v16-water-drop';d.style.left=(e.clientX+(Math.random()*10-5))+'px';d.style.top=(e.clientY+(Math.random()*10-5))+'px';d.style.width=d.style.height=(5+Math.random()*6)+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),760);
    },{passive:true});
  }
  function touchRipple(){
    addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const r=document.createElement('i');r.className='v16-touch-ripple';r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),600)},{passive:true});
  }
  function profileObserver(){
    const b=$('#accountButton');if(!b)return;
    const paint=()=>{const dot=$('.avatar-dot',b);if(!dot||dot.querySelector('img'))return;const img=document.createElement('img');img.alt='';const email=$('#accountMenuEmail')?.textContent||'';if(/suhail/i.test(email)||/suhail/i.test($('.account-lines b',b)?.textContent||''))img.src='./assets/images/suhail-saeedy.webp';else return;dot.textContent='';dot.appendChild(img)};
    paint();new MutationObserver(paint).observe(b,{childList:true,subtree:true,characterData:true});
  }
  function keyboardSearch(){
    addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput,#heroSearchMirror')?.focus()}});
  }
  function desktopCardDensity(){
    // Keep only the rendered dataset visible; CSS handles 4-column desktop / compact 2-column mobile.
    const grid=$('#termGrid');if(!grid)return;
    new MutationObserver(()=>{$$('.term-card',grid).forEach(c=>c.setAttribute('data-v16','1'))}).observe(grid,{childList:true});
  }


  function syncMedicalImages(){
    const dark=['dark','ocean'].includes(document.body.dataset.theme);
    const mode=dark?'dark':'light';
    $$('img[data-v12-asset]').forEach(img=>{const a=img.dataset.v12Asset;if(a)img.src=`./assets/images/v12/${a}-${mode}.webp`});
    const hero=$('[data-v16-hero-art]');if(hero)hero.src=innerWidth<=820?`./assets/images/v16/hero-mobile-${mode}.webp`:`./assets/images/v16/hero-art-${mode}.webp`;
  }
  function themeImageSync(){
    const sel=$('#themeSelect');if(sel){sel.addEventListener('change',()=>setTimeout(syncMedicalImages,0));}
    new MutationObserver(syncMedicalImages).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
    const grid=$('#termGrid');if(grid)new MutationObserver(syncMedicalImages).observe(grid,{childList:true,subtree:true});
    syncMedicalImages();
  }

  function advancedFilters(){
    const btn=$('#advancedFiltersButton'); if(!btn||btn.dataset.bound)return; btn.dataset.bound='1';
    let pop=null;
    const close=()=>{pop?.remove();pop=null;document.removeEventListener('pointerdown',outside,true)};
    const outside=e=>{if(pop&&!pop.contains(e.target)&&e.target!==btn)close()};
    btn.addEventListener('click',e=>{
      e.stopPropagation(); if(pop){close();return}
      pop=document.createElement('div');pop.className='advanced-filter-popover';
      const r=btn.getBoundingClientRect();pop.style.top=Math.min(innerHeight-260,r.bottom+8)+'px';pop.style.left=Math.max(10,Math.min(innerWidth-290,r.right-280))+'px';
      const cat=$('#categorySelect'),sort=$('#sortSelect');
      pop.innerHTML=`<h3>Advanced Filters</h3><label>Category<select id="afCategory">${cat?.innerHTML||''}</select></label><label>Sort<select id="afSort">${sort?.innerHTML||''}</select></label><div class="af-actions"><button id="afReset">Reset</button><button id="afApply" class="primary">Apply</button></div>`;
      document.body.appendChild(pop); const c=$('#afCategory',pop),so=$('#afSort',pop); if(cat)c.value=cat.value;if(sort)so.value=sort.value;
      $('#afReset',pop).onclick=()=>{if(cat){cat.value='all';cat.dispatchEvent(new Event('change',{bubbles:true}))}if(sort){sort.value='relevant';sort.dispatchEvent(new Event('change',{bubbles:true}))}close()};
      $('#afApply',pop).onclick=()=>{if(cat){cat.value=c.value;cat.dispatchEvent(new Event('change',{bubbles:true}))}if(sort){sort.value=so.value;sort.dispatchEvent(new Event('change',{bubbles:true}))}close()};
      setTimeout(()=>document.addEventListener('pointerdown',outside,true),0);
    });
  }

  function aiMobileNav(){
    if(!document.body.classList.contains('ai-page'))return;
    const nav=$('.mobile-bottom-nav');if(nav){const a=nav.querySelectorAll('a');a.forEach(x=>x.classList.toggle('active',/ai\.html/.test(x.getAttribute('href')||'')))}
  }
  function init(){installIcons();decorateHero();mobileDrawer();bell();add3DControl();advancedFilters();sidePromo();studyBot();themeLabels();themeImageSync();waterCursor();touchRipple();profileObserver();keyboardSearch();desktopCardDensity();aiMobileNav();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
