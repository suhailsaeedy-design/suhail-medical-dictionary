(() => {
  'use strict';
  let cfgPromise=null;
  const loadConfig=()=>cfgPromise||(cfgPromise=fetch('data/admin-config.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Admin config failed to load'))));
  const roleFromUser=(user,cfg)=>String(user?.app_metadata?.[cfg?.cloudAdmin?.roleClaim||'smd_role']||'').toLowerCase();
  const allowed=(role,cfg)=>(cfg?.cloudAdmin?.allowedRoles||['owner','admin']).map(x=>String(x).toLowerCase()).includes(String(role||'').toLowerCase());
  async function verifiedCloudRole(){
    const cfg=await loadConfig();
    if(!cfg?.cloudAdmin?.enabled)return {enabled:false,authorized:false,role:'',reason:'Secure owner access is disabled.'};
    if(!window.SMD21CloudAuth)return {enabled:true,authorized:false,role:'',reason:'Cloud authentication is unavailable.'};
    const st=await SMD21CloudAuth.status();
    if(!st.configured)return {enabled:true,authorized:false,role:'',reason:'Cloud authentication is not configured.'};
    if(!st.connected)return {enabled:true,configured:true,connected:false,authorized:false,role:'',config:cfg,authStatus:st,reason:'No verified cloud session is connected.'};
    let user=st.session?.user||{};
    if(window.SMD21CloudAuth.getVerifiedUser){try{user=await SMD21CloudAuth.getVerifiedUser()}catch(err){return {enabled:true,configured:true,connected:true,authorized:false,role:'',config:cfg,authStatus:st,reason:err.message||'Owner verification failed.'}}}
    const normalizeEmail=v=>String(v||'').trim().toLowerCase();
    const localEmail=normalizeEmail(window.SMD21Auth?.getAccount?.()?.email);
    const cloudEmail=normalizeEmail(user?.email);
    if(!localEmail||!cloudEmail||localEmail!==cloudEmail){
      return {enabled:true,configured:true,connected:true,authorized:false,role:'',user,config:cfg,authStatus:st,reason:'The current app account does not match the verified owner account. Sign in again with the owner account.'};
    }
    const role=roleFromUser(user,cfg);
    const ownerEmail=normalizeEmail(cfg?.cloudAdmin?.ownerEmail||'suhailsaeedy@gmail.com');
    const ownerEmailOk=cloudEmail===ownerEmail;
    const ok=allowed(role,cfg)&&ownerEmailOk;
    return {enabled:true,configured:true,connected:true,authorized:ok,role,user,config:cfg,authStatus:st,reason:ok?'Verified owner account.':'Only the verified owner account can open this private console.'};
  }
  window.SMD21AdminAuth={loadConfig,verifiedCloudRole,roleFromUser,allowed};
})();
