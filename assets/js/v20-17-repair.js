(()=>{
'use strict';
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
// One public shell: Dashboard/Admin never appear in regular navigation.
$$('.med-nav-item').forEach(el=>{const t=(el.textContent||'').trim().toLowerCase(),h=(el.getAttribute('href')||'').toLowerCase();if(t.includes('dashboard')||t.includes('admin panel')||h.includes('#dashboard')||h.includes('admin.html'))el.remove();});
$('#adminSidebarLink')?.remove?.();$('#adminLink')?.remove?.();
function $(s,r=document){return r.querySelector(s)}
// Normalize mobile nav and preserve Light theme on mobile.
const savedTheme=localStorage.getItem('smd-theme');if(savedTheme)document.body.dataset.theme=savedTheme;
addEventListener('storage',e=>{if(e.key==='smd-theme'&&e.newValue)document.body.dataset.theme=e.newValue;});
// Universal PWA install behavior, including iOS guidance.
let installPrompt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$$('[data-install-app]').forEach(b=>b.classList.add('v20-install-ready'));});
function isStandalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function showIOSInstall(){
 let m=$('#v2017IosInstall');if(!m){m=document.createElement('div');m.id='v2017IosInstall';m.innerHTML='<div class="v2017-install-card"><button type="button" aria-label="Close">×</button><img src="./assets/icons/icon-192.png" alt=""><h2>Install Suhail Medical</h2><p>On iPhone/iPad, Safari does not allow a website to add itself automatically.</p><ol><li>Open this site in <b>Safari</b>.</li><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. The Suhail icon will appear on your Home Screen.</li></ol></div>';document.body.appendChild(m);m.querySelector('button').onclick=()=>m.remove();}
 m.hidden=false;
}
document.addEventListener('click',async e=>{const btn=e.target.closest?.('[data-install-app]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();if(isStandalone())return alert('Suhail Medical is already installed as an app on this device.');if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return;}if(/iphone|ipad|ipod/i.test(navigator.userAgent))return showIOSInstall();alert('Use your browser menu and choose Install app / Add to Home Screen.');},true);
// Register SW even on the sign-in page so PWA installation has an active scope.
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
})();
