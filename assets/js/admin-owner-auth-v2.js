(() => {
  'use strict';
  const CONFIG_URL=window.SMD21_ADMIN_CONFIG_URL||'data/admin-config.json';
  let cfgPromise=null;
  const loadConfig=()=>cfgPromise||(cfgPromise=fetch(CONFIG_URL,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Admin config failed to load'))));

  async function gatewayRequest(st, action, payload={}) {
    const base=String(st.config.supabaseUrl||'').replace(/\/+$/,'');
    const res=await fetch(`${base}/functions/v1/admin-gateway`,{
      method:'POST',
      headers:{
        apikey:st.config.publishableKey,
        Authorization:`Bearer ${st.session.access_token}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({action,...payload}),
      cache:'no-store'
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body?.error||body?.message||`Secure admin request failed (${res.status})`);
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
    }catch{
      return {enabled:true,authorized:false,config:cfg,authStatus:st,reason:'Sign-in verification failed.'};
    }
  }

  window.SMD21AdminAuth={loadConfig,verifiedCloudRole,gatewayRequest};
})();