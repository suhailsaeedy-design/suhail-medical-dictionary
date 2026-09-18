(function(){
  'use strict';
  const cfg=window.SUHAIL_CONFIG||{};
  const PREFIX='suhail-medical-v10';
  const AUTH_KEY=PREFIX+':auth';
  const DEFAULT_TIMEOUT=9000;
  let readyResolve;
  const ready=new Promise(r=>readyResolve=r);

  function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function toast(message,type='good'){
    const stack=document.getElementById('toastStack');
    if(!stack){console[type==='bad'?'error':'log'](message);return}
    const el=document.createElement('div');el.className=`toast ${type}`;el.innerHTML=`<span>${type==='bad'?'⚠':'✓'}</span><div>${escapeHtml(message)}</div>`;stack.appendChild(el);setTimeout(()=>el.remove(),4200);
  }
  function apiBase(){return String(cfg.SUPABASE_URL||'').replace(/\/$/,'')}
  function configured(){return /^https:\/\//.test(apiBase())&&String(cfg.SUPABASE_ANON_KEY||'').length>10}
  function withTimeout(promise,ms=DEFAULT_TIMEOUT,label='Request'){
    let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out. Please retry.`)),ms)})]).finally(()=>clearTimeout(timer));
  }
  function jsonParse(raw){try{return JSON.parse(raw)}catch{return null}}
  function readStored(){
    try{return jsonParse(sessionStorage.getItem(AUTH_KEY))||jsonParse(localStorage.getItem(AUTH_KEY))}catch{return null}
  }
  function saveStored(session,remember=true){
    if(!session?.access_token||!session?.user)throw new Error('The sign-in response was incomplete.');
    localStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(AUTH_KEY);
    (remember?localStorage:sessionStorage).setItem(AUTH_KEY,JSON.stringify(session));return session;
  }
  function clearStored(){try{localStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(PREFIX+':oauth-inflight')}catch{}}
  function authHeaders(token,extra={}){const h={apikey:cfg.SUPABASE_ANON_KEY,...extra};if(token)h.Authorization=`Bearer ${token}`;return h}
  async function parseResponse(res){
    const text=await res.text();const body=text?jsonParse(text):null;
    if(!res.ok){const err=new Error(body?.msg||body?.message||body?.error_description||body?.error||`Request failed (${res.status}).`);err.status=res.status;throw err}return body;
  }
  function decodeJwtUser(token){
    try{const part=token.split('.')[1];const norm=part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=');const payload=JSON.parse(decodeURIComponent(Array.from(atob(norm),c=>`%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join('')));if(!payload?.sub)return null;return {id:payload.sub,email:payload.email||'',user_metadata:payload.user_metadata||{},app_metadata:payload.app_metadata||{}}}catch{return null}
  }
  function normalizeUser(user){
    if(!user)return null;const m=user.user_metadata||{};return {id:user.id||user.sub,email:user.email||'',name:m.full_name||m.name||user.email?.split('@')[0]||'Medical Learner',avatar:m.avatar_url||m.picture||''};
  }
  function normalizeSession(raw){if(!raw?.user)return null;return {provider:'supabase',user:normalizeUser(raw.user),raw}}
  async function fetchUser(accessToken){const res=await withTimeout(fetch(`${apiBase()}/auth/v1/user`,{headers:authHeaders(accessToken)}),7000,'Verifying your session');return parseResponse(res)}
  async function captureOAuthCallback(){
    if(!configured()||!location.hash?.startsWith('#'))return null;
    const p=new URLSearchParams(location.hash.slice(1));const err=p.get('error_description')||p.get('error');
    if(err){history.replaceState(null,'',location.pathname+location.search);throw new Error(err)}
    const access=p.get('access_token');if(!access)return null;
    let user=null;try{user=await fetchUser(access)}catch{user=decodeJwtUser(access)}
    if(!user?.id)throw new Error('Google sign-in completed, but the user session could not be read.');
    const expiresIn=Number(p.get('expires_in')||3600);const raw={access_token:access,refresh_token:p.get('refresh_token')||'',token_type:p.get('token_type')||'bearer',expires_in:expiresIn,expires_at:Number(p.get('expires_at')||0)||Math.floor(Date.now()/1000)+expiresIn,user};
    saveStored(raw,true);history.replaceState(null,'',location.pathname+location.search);return raw;
  }
  async function refreshSession(raw){
    if(!raw?.refresh_token)return null;
    const res=await withTimeout(fetch(`${apiBase()}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:authHeaders(null,{'content-type':'application/json'}),body:JSON.stringify({refresh_token:raw.refresh_token})}),8000,'Refreshing your session');
    const data=await parseResponse(res);data.user=data.user||decodeJwtUser(data.access_token);if(!data.access_token||!data.user?.id)return null;data.expires_at=data.expires_at||Math.floor(Date.now()/1000)+Number(data.expires_in||3600);return saveStored(data,!!localStorage.getItem(AUTH_KEY));
  }
  async function currentRawSession(){
    if(!configured())return null;
    const cb=await captureOAuthCallback();if(cb)return cb;
    const raw=readStored();if(!raw)return null;const now=Math.floor(Date.now()/1000);
    if(!raw.expires_at||Number(raw.expires_at)>now+45)return raw;
    try{return await refreshSession(raw)}catch{clearStored();return null}
  }
  async function getSession(){const raw=await currentRawSession();return normalizeSession(raw)}
  function googleUrl(redirectTo){
    const u=new URL(`${apiBase()}/auth/v1/authorize`);u.searchParams.set('provider','google');u.searchParams.set('redirect_to',redirectTo);if(cfg.GOOGLE_PROMPT_SELECT_ACCOUNT!==false)u.searchParams.set('prompt','select_account');return u;
  }
  async function googleSignIn(){
    if(!configured()){toast('Google sign-in is not configured.','bad');return}
    sessionStorage.setItem(PREFIX+':oauth-inflight','1');location.assign(googleUrl(new URL('app.html',location.href).href).toString());
  }
  async function emailSignIn(email,password,remember=true){
    if(!configured())throw new Error('Secure account service is not configured.');
    if(!email||!password)throw new Error('Enter your email and password.');
    const res=await withTimeout(fetch(`${apiBase()}/auth/v1/token?grant_type=password`,{method:'POST',headers:authHeaders(null,{'content-type':'application/json'}),body:JSON.stringify({email,password})}),9000,'Signing in');
    const raw=await parseResponse(res);raw.user=raw.user||decodeJwtUser(raw.access_token);saveStored(raw,remember);return normalizeSession(raw);
  }
  async function emailSignUp(name,email,password){
    if(!configured())throw new Error('Secure account service is not configured.');if(password.length<8)throw new Error('Password must be at least 8 characters.');
    const res=await withTimeout(fetch(`${apiBase()}/auth/v1/signup`,{method:'POST',headers:authHeaders(null,{'content-type':'application/json'}),body:JSON.stringify({email,password,data:{full_name:name}})}),9000,'Creating account');
    const raw=await parseResponse(res);if(raw?.access_token&&raw?.user){saveStored(raw,true);return {signedIn:true}}return {signedIn:false};
  }
  async function resetPassword(email){
    if(!configured())throw new Error('Password reset is not configured.');
    const res=await withTimeout(fetch(`${apiBase()}/auth/v1/recover`,{method:'POST',headers:authHeaders(null,{'content-type':'application/json'}),body:JSON.stringify({email})}),8000,'Sending reset email');await parseResponse(res);return true;
  }
  async function serverLogout(){
    const raw=readStored();clearStored();if(raw?.access_token&&navigator.onLine){try{await withTimeout(fetch(`${apiBase()}/auth/v1/logout?scope=local`,{method:'POST',headers:authHeaders(raw.access_token)}),3500,'Signing out')}catch{}}
  }
  async function signOut(){await serverLogout();location.replace(new URL('index.html',location.href).href)}
  async function switchAccount(){await serverLogout();if(configured()){location.assign(googleUrl(new URL('app.html',location.href).href).toString())}else location.assign(new URL('index.html?choose=1',location.href).href)}

  async function initAppGuard(){
    try{const session=await getSession();if(!session){location.replace(new URL('index.html',location.href).href);return}window.dispatchEvent(new CustomEvent('suhail:auth-ready',{detail:session}))}catch(e){toast(e.message||'Sign-in session could not be opened.','bad');setTimeout(()=>location.replace(new URL('index.html?choose=1',location.href).href),900)}
  }
  function initLoginPage(){
    const note=document.getElementById('authModeNote');if(note)note.textContent=configured()?'Secure account mode is active. Google sign-in always opens the account chooser.':'Account service is not configured.';
    document.querySelectorAll('[data-toggle-password]').forEach(btn=>btn.addEventListener('click',()=>{const input=document.getElementById(btn.dataset.togglePassword);if(!input)return;input.type=input.type==='password'?'text':'password';btn.textContent=input.type==='password'?'◉':'◎'}));
    document.getElementById('showSignup')?.addEventListener('click',()=>document.getElementById('authCard').classList.add('signup-open'));
    document.getElementById('showSignin')?.addEventListener('click',()=>document.getElementById('authCard').classList.remove('signup-open'));
    document.getElementById('googleSignIn')?.addEventListener('click',googleSignIn);document.getElementById('googleSignup')?.addEventListener('click',googleSignIn);
    document.getElementById('signinForm')?.addEventListener('submit',async e=>{e.preventDefault();const email=document.getElementById('signinEmail').value.trim();const pw=document.getElementById('signinPassword').value;const remember=document.getElementById('rememberMe').checked;try{await emailSignIn(email,pw,remember);location.href=new URL('app.html',location.href).href}catch(err){toast(err.message||'Sign in failed.','bad')}});
    document.getElementById('signupForm')?.addEventListener('submit',async e=>{e.preventDefault();const name=document.getElementById('signupName').value.trim();const email=document.getElementById('signupEmail').value.trim();const pw=document.getElementById('signupPassword').value;try{const r=await emailSignUp(name,email,pw);if(r.signedIn)location.href=new URL('app.html',location.href).href;else toast('Account created. Check your email if confirmation is enabled.')}catch(err){toast(err.message||'Account creation failed.','bad')}});
    document.getElementById('forgotPassword')?.addEventListener('click',async e=>{e.preventDefault();const email=document.getElementById('signinEmail').value.trim();if(!email){toast('Enter your email address first.','bad');return}try{await resetPassword(email);toast('Password reset email sent.')}catch(err){toast(err.message||'Reset email could not be sent.','bad')}});
    const theme=document.getElementById('loginTheme'),lang=document.getElementById('loginLanguage');const savedTheme=localStorage.getItem(PREFIX+':theme')||cfg.DEFAULT_THEME||'light';document.documentElement.dataset.theme=savedTheme;if(theme)theme.value=savedTheme;
    theme?.addEventListener('change',()=>{document.documentElement.dataset.theme=theme.value;localStorage.setItem(PREFIX+':theme',theme.value)});lang?.addEventListener('change',()=>{localStorage.setItem(PREFIX+':language',lang.value);document.documentElement.lang=lang.value;document.documentElement.dir=['ps','fa','ar'].includes(lang.value)?'rtl':'ltr'});
    if(new URLSearchParams(location.search).get('choose')==='1')toast('Choose the Google account you want to use.');
    getSession().then(s=>{if(s&&!new URLSearchParams(location.search).has('choose'))location.replace(new URL('app.html',location.href).href)}).catch(()=>{});
  }
  async function init(){readyResolve();if(document.body.classList.contains('login-page'))initLoginPage();if(document.body.classList.contains('app-page'))initAppGuard()}
  window.SuhailAuth={ready,getSession,signOut,switchAccount,googleSignIn,emailSignIn,emailSignUp,resetPassword,toast,escapeHtml,configured,currentRawSession};
  init();
})();
