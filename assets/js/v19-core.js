(()=>{
 'use strict';
 let installPrompt=null;
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const toast=(msg)=>{let n=$('.v19-offline-toast');if(!n){n=document.createElement('div');n.className='v19-offline-toast';document.body.appendChild(n)}n.textContent=msg;clearTimeout(n._t);n._t=setTimeout(()=>n.remove(),3200)};
 const RTL=new Set(['ps','prs','fa','ar']);
 function syncPreferences(){
   const theme=localStorage.getItem('smd-theme')||document.body.dataset.theme||'dark';
   const lang=localStorage.getItem('smd-content-lang')||localStorage.getItem('smd-ui-lang')||document.documentElement.lang||'en';
   document.body.dataset.theme=theme;document.body.dataset.contentDir=RTL.has(lang)?'rtl':'ltr';document.documentElement.lang=lang;
   document.body.dataset.bgStyle=localStorage.getItem('smd-bg-style')||document.body.dataset.bgStyle||'bubbles';
   document.body.dataset.accent=localStorage.getItem('smd-accent')||document.body.dataset.accent||'blue';
   document.body.classList.toggle('effects-off',localStorage.getItem('smd-animations')==='0');
   document.body.classList.toggle('model-glow-off',localStorage.getItem('smd-model-glow')==='0');
   document.body.classList.toggle('reduce-motion',localStorage.getItem('smd-reduce-motion')==='1');
 }
 function bindInstall(){
   window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$$('[data-install-app]').forEach(b=>b.classList.add('v19-ready'))});
   $$('[data-install-app]').forEach(btn=>btn.addEventListener('click',async()=>{
     if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return;}
     if(/iPhone|iPad|iPod/i.test(navigator.userAgent))toast('iPhone/iPad: Share → Add to Home Screen.');
     else toast('Browser menu → Install app / Add to home screen.');
   }));
   window.addEventListener('appinstalled',()=>toast('Suhail Medical Dictionary installed.'));
 }
 function syncNetwork(){
   const offline=!navigator.onLine;document.body.classList.toggle('v19-offline',offline);
   const status=$('#networkStatus');if(status){status.innerHTML=`<i></i>${offline?'Offline':'Online'}`;status.dataset.state=offline?'offline':'online'}
   $$('a[href="./ai.html"],#detailAI,#aiSelectedButton').forEach(el=>{el.setAttribute('aria-disabled',offline?'true':'false');el.title=offline?'AI needs internet. Dictionary and saved anatomy remain available.':''});
   let banner=$('.v19-ai-offline-banner');
   if(offline && /\/ai\.html$/.test(location.pathname)){if(!banner){banner=document.createElement('div');banner.className='v19-ai-offline-banner';banner.innerHTML='<b>AI is offline</b>Dictionary, downloaded packs, bookmarks and 3D Anatomy remain available.';document.body.prepend(banner)}}else banner?.remove();
 }
 function guardAI(e){const target=e.target.closest('a[href="./ai.html"],#detailAI,#aiSelectedButton');if(!target||navigator.onLine)return;e.preventDefault();e.stopPropagation();toast('AI Study needs internet. Dictionary, offline packs, and saved anatomy still work.');}
 function enhanceDesktop(){
   const chips=$('#categoryChipRow'),adv=$('#advancedFiltersButton');if(chips&&adv&&!chips.contains(adv)){adv.classList.add('v19-advanced-inline');chips.appendChild(adv)}
   const top=$('.med-top-actions');if(top&&!$('.v19-notify',top)){const bell=document.createElement('button');bell.className='v19-notify icon-link';bell.type='button';bell.title='Notifications';bell.innerHTML='◔<b>3</b>';top.insertBefore(bell,$('.account-wrap',top));}
   const admin=$('#adminLink'),side=$('#adminSidebarLink');if(admin&&side){const sync=()=>side.classList.toggle('hidden',admin.classList.contains('hidden'));sync();new MutationObserver(sync).observe(admin,{attributes:true,attributeFilter:['class']})}
 }
 function cardTilt(){
   if(matchMedia('(pointer:coarse)').matches)return;
   document.addEventListener('pointermove',e=>{const c=e.target.closest('.term-card');if(!c)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(700px) rotateX(${-y*3}deg) rotateY(${x*4}deg) translateY(-2px)`});
   document.addEventListener('pointerout',e=>{const c=e.target.closest('.term-card');if(c)c.style.transform=''});
 }
 document.addEventListener('click',guardAI,true);window.addEventListener('online',syncNetwork);window.addEventListener('offline',syncNetwork);window.addEventListener('storage',e=>{if(!e.key||e.key.startsWith('smd-'))syncPreferences();});
 document.addEventListener('DOMContentLoaded',()=>{syncPreferences();bindInstall();syncNetwork();enhanceDesktop();cardTilt()});
})();
