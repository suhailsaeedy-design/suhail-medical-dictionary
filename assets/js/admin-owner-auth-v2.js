(() => {
  'use strict';
  const CONFIG_URL=window.SMD21_ADMIN_CONFIG_URL||'data/admin-config.json';
  let cfgPromise=null;
  const loadConfig=()=>cfgPromise||(cfgPromise=fetch(CONFIG_URL,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Admin config failed to load'))));
  const DEVICE_KEY='suhail_private_admin_device_v1';
  const currentPanel=()=>location.pathname.includes('/suhail-labs/')?'suhail-labs':'medical-dictionary';
  function deviceDescriptor(){
    let id='';
    try{
      id=localStorage.getItem(DEVICE_KEY)||'';
      if(!id){
        id=crypto.randomUUID?crypto.randomUUID():('dev-'+Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join(''));
        localStorage.setItem(DEVICE_KEY,id);
      }
    }catch{
      id='session-'+Math.random().toString(36).slice(2)+Date.now().toString(36);
    }
    const ua=String(navigator.userAgent||'');
    const platform=String(navigator.userAgentData?.platform||navigator.platform||'Unknown platform');
    const browser=/Edg\//.test(ua)?'Edge':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'Browser';
    const form=navigator.userAgentData?.mobile||/Android|iPhone|iPad|Mobile/i.test(ua)?'Mobile':'Desktop';
    return {id,label:`${platform} · ${browser} · ${form}`.slice(0,200),user_agent:ua.slice(0,600)};
  }

  async function gatewayRequest(st, action, payload={}) {
    const base=String(st.config.supabaseUrl||'').replace(/\/+$/,'');
    const res=await fetch(`${base}/functions/v1/admin-gateway`,{
      method:'POST',
      headers:{
        apikey:st.config.publishableKey,
        Authorization:`Bearer ${st.session.access_token}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({action,...payload,panel:payload.panel||currentPanel(),device:deviceDescriptor()}),
      cache:'no-store'
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok){
      const error=new Error(body?.error||body?.message||`Secure admin request failed (${res.status})`);
      error.status=res.status;
      error.blocked=body?.blocked===true;
      throw error;
    }
    return body;
  }

  async function verifiedCloudRole(){
    const cfg=await loadConfig();
    if(!cfg?.cloudAdmin?.enabled)return {enabled:false,authorized:false,reason:'Private administration is unavailable.'};
    if(!window.SMD21CloudAuth)return {enabled:true,authorized:false,reason:'Secure sign-in is unavailable.'};
    const st=await SMD21CloudAuth.status();
    if(!st.configured||!st.connected||st.source!=='session'||!st.session?.access_token){
      return {enabled:true,authorized:false,config:cfg,authStatus:st,reason:'A fresh verified sign-in is required.'};
    }
    try{
      const body=await gatewayRequest(st,'authorize');
      const ok=body?.authorized===true;
      const user=st.session?.user||{};
      return {
        enabled:true,configured:true,connected:true,authorized:ok,
        role:ok?'owner':'',user,config:cfg,authStatus:st,
        reason:ok?'Verified owner session.':'This account is not authorized for private administration.'
      };
    }catch(err){
      return {
        enabled:true,authorized:false,config:cfg,authStatus:st,
        blocked:err?.blocked===true,
        reason:err?.blocked===true
          ? 'Private administration is unavailable for this account or device.'
          : 'Sign-in verification failed.'
      };
    }
  }

  window.SMD21AdminAuth={loadConfig,verifiedCloudRole,gatewayRequest};
})();