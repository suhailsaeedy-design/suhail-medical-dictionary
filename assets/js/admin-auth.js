(() => {
  'use strict';
  const CONFIG_URL=window.SMD21_ADMIN_CONFIG_URL||'data/admin-config.json';
  let cfgPromise=null;
  const loadConfig=()=>cfgPromise||(cfgPromise=fetch(CONFIG_URL,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Admin config failed to load'))));
  const roleFromUser=(user,cfg)=>String(user?.app_metadata?.[cfg?.cloudAdmin?.roleClaim||'smd_role']||'').toLowerCase();
  async function verifiedCloudRole(){
    const cfg=await loadConfig();
    if(!cfg?.cloudAdmin?.enabled)return {enabled:false,authorized:false,role:'',reason:'Private administration is unavailable.'};
    if(!window.SMD21CloudAuth)return {enabled:true,authorized:false,role:'',reason:'Secure sign-in is unavailable.'};
    const st=await SMD21CloudAuth.status();
    if(!st.configured||!st.connected||st.source!=='session')return {enabled:true,authorized:false,role:'',config:cfg,authStatus:st,reason:'A fresh verified sign-in is required.'};
    let user=st.session?.user||{};
    try{user=await SMD21CloudAuth.getVerifiedUser()}catch{return {enabled:true,authorized:false,role:'',config:cfg,authStatus:st,reason:'Sign-in verification failed.'}}
    const role=roleFromUser(user,cfg),ok=role==='owner';
    return {enabled:true,configured:true,connected:true,authorized:ok,role,user,config:cfg,authStatus:st,reason:ok?'Verified owner session.':'This account is not authorized for private administration.'};
  }
  window.SMD21AdminAuth={loadConfig,verifiedCloudRole,roleFromUser};
})();