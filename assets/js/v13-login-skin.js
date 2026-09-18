(()=>{'use strict';
if(innerWidth<=700)return;
const $=s=>document.querySelector(s);let skin,controls;
const dark=()=>['dark','ocean'].includes(document.body.dataset.theme);
function bg(){return `./assets/reference-pixel/login-${dark()?'dark':'light'}.png`}
function setSkin(){if(skin)skin.style.backgroundImage=`url("${bg()}")`}
function live(){document.body.classList.add('pixel-login-live')}
function hit(cls,fn){const b=document.createElement('button');b.type='button';b.className='pixel-login-hit '+cls;b.onclick=e=>{e.preventDefault();fn?.()};controls.appendChild(b)}
function startGoogle(){const g=$('#googleSignIn');if(g)g.click();else live()}
function init(){
 skin=document.createElement('div');skin.className='pixel-login-skin';controls=document.createElement('div');controls.className='pixel-login-controls';document.body.append(skin,controls);setSkin();document.body.classList.add('pixel-login-ready');
 const email=document.createElement('input');email.type='email';email.autocomplete='email';email.className='pixel-login-input pl-email';email.setAttribute('aria-label','Google email hint');controls.appendChild(email);
 const pass=document.createElement('input');pass.type='text';pass.readOnly=true;pass.className='pixel-login-input pl-pass';pass.setAttribute('aria-label','Google password stays with Google');controls.appendChild(pass);pass.onclick=startGoogle;
 hit('pl-signin',startGoogle);hit('pl-google',startGoogle);hit('pl-create',startGoogle);
 const theme=document.createElement('select');theme.className='pixel-login-select pl-theme';theme.innerHTML='<option value="clinical">Light</option><option value="dark">Dark</option>';theme.value=localStorage.getItem('smd-theme')||'clinical';controls.appendChild(theme);theme.onchange=()=>{document.body.dataset.theme=theme.value;localStorage.setItem('smd-theme',theme.value);setSkin()};
 const lang=document.createElement('select');lang.className='pixel-login-select pl-lang';lang.innerHTML=$('#loginLanguage')?.innerHTML||'<option>English</option>';lang.value=$('#loginLanguage')?.value||'en';controls.appendChild(lang);lang.onchange=()=>{const l=$('#loginLanguage');if(l){l.value=lang.value;l.dispatchEvent(new Event('change',{bubbles:true}))}};
 // OAuth callback/consent state must be shown as a live form rather than kept behind the static reference artwork.
 const obs=new MutationObserver(()=>{const c=$('#consentPanel'),r=$('#returningPanel');if((c&&!c.classList.contains('hidden'))||(r&&!r.classList.contains('hidden')))live()});obs.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
