(() => {
  const CONFIG_URL='data/auth-config.json';
  const SESSION_KEY=SMD21Auth.CLOUD_SESSION||'smd21_cloud_session';
  let configPromise=null;
  const cleanBase=(v)=>String(v||'').replace(/\/+$/,'');
  const json=async(res)=>{const t=await res.text();try{return t?JSON.parse(t):{}}catch{return {error_description:t||`HTTP ${res.status}`}}};
  async function config(){
    if(!configPromise)configPromise=fetch(CONFIG_URL,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Auth config failed to load'))).catch(err=>({enabled:false,error:String(err)}));
    return configPromise;
  }
  function configured(c){return !!(c?.enabled&&cleanBase(c.supabaseUrl)&&String(c.publishableKey||'').trim()&&c.security?.allowServiceRoleInBrowser===false);}
  function session(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
  function saveSession(s){sessionStorage.setItem(SESSION_KEY,JSON.stringify(s));}
  function clearSession(){sessionStorage.removeItem(SESSION_KEY);}
  function callbackUrl(c){const base=String(c?.productionSiteUrl||'').trim();return new URL(c.redirectPath||'auth-callback.html',base||location.href).href.split('#')[0];}
  async function startGoogleSignIn(returnTo='app.html#dictionary'){
    const c=await config();if(!configured(c))throw new Error('Optional Google/Supabase sign-in is not configured.');
    sessionStorage.setItem('smd21_oauth_return',returnTo);
    const u=new URL(`${cleanBase(c.supabaseUrl)}/auth/v1/authorize`);
    u.searchParams.set('provider',c.provider||'google');
    u.searchParams.set('redirect_to',callbackUrl(c));
    u.searchParams.set('prompt','select_account');
    location.assign(u.toString());
  }
  async function requestUser(accessToken,c){
    const r=await fetch(`${cleanBase(c.supabaseUrl)}/auth/v1/user`,{headers:{apikey:c.publishableKey,Authorization:`Bearer ${accessToken}`}});
    const body=await json(r);if(!r.ok)throw new Error(body.msg||body.error_description||body.message||`User lookup failed (${r.status})`);return body;
  }
  async function refreshSession(){
    const c=await config(),s=session();if(!configured(c)||!s?.refresh_token)return null;
    const r=await fetch(`${cleanBase(c.supabaseUrl)}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
    const body=await json(r);if(!r.ok){clearSession();return null;}
    const user=body.user||await requestUser(body.access_token,c);
    const next={access_token:body.access_token,refresh_token:body.refresh_token||s.refresh_token,expires_at:Date.now()+Math.max(60,Number(body.expires_in||3600))*1000,user:{id:user.id,email:user.email,app_metadata:user.app_metadata||{}}};saveSession(next);return next;
  }
  async function getValidSession(){
    const s=session();if(!s?.access_token)return null;if(!s.expires_at||s.expires_at-Date.now()>60000)return s;return refreshSession();
  }
  async function handleCallback(){
    const c=await config();if(!configured(c))throw new Error('Cloud authentication is disabled or incomplete.');
    const q=new URLSearchParams(location.search);if(q.get('error'))throw new Error(q.get('error_description')||q.get('error'));
    const h=new URLSearchParams(location.hash.replace(/^#/,''));
    const access=h.get('access_token');const refresh=h.get('refresh_token');
    if(!access){if(q.get('code'))throw new Error('This callback returned a PKCE code, but this static build is configured for the browser implicit flow. Restart Google sign-in from the app.');throw new Error('No authentication token was returned.');}
    if(!SMD21Auth.getConsent()?.privacy||!SMD21Auth.getConsent()?.terms)throw new Error('Privacy and Terms consent is required before cloud sign-in.');
    const user=await requestUser(access,c);
    const expiresIn=Math.max(60,Number(h.get('expires_in')||3600));
    saveSession({access_token:access,refresh_token:refresh||'',expires_at:Date.now()+expiresIn*1000,user:{id:user.id,email:user.email,app_metadata:user.app_metadata||{}}});
    SMD21Auth.saveAccount(user.email,'google',{id:user.id,cloud:true});
    history.replaceState(null,'',location.pathname+location.search);
    return {user,returnTo:sessionStorage.getItem('smd21_oauth_return')||'app.html#dictionary'};
  }
  async function getVerifiedUser(){const c=await config(),s=await getValidSession();if(!configured(c)||!s?.access_token)throw new Error('No verified cloud session is connected.');const user=await requestUser(s.access_token,c);saveSession({...s,user:{id:user.id,email:user.email,app_metadata:user.app_metadata||{}}});return user;}
  async function signOutRemote(){
    const c=await config(),s=await getValidSession();
    try{if(configured(c)&&s?.access_token)await fetch(`${cleanBase(c.supabaseUrl)}/auth/v1/logout`,{method:'POST',headers:{apikey:c.publishableKey,Authorization:`Bearer ${s.access_token}`}});}finally{clearSession();}
  }
  async function status(){const c=await config(),s=await getValidSession();return {configured:configured(c),config:c,session:s,connected:!!(s?.access_token&&s?.user?.id)};}
  window.SMD21CloudAuth={config,configured,session,getValidSession,refreshSession,getVerifiedUser,startGoogleSignIn,handleCallback,signOutRemote,status,clearSession,callbackUrl};
})();
