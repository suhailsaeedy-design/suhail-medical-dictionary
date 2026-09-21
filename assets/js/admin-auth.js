(() => {
  const ADMIN_MODE='smd21_admin_mode';
  let cfgPromise=null;
  const loadConfig=()=>cfgPromise||(cfgPromise=fetch('data/admin-config.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Admin config failed to load'))));
  const roleFromUser=(user,cfg)=>String(user?.app_metadata?.[cfg?.cloudAdmin?.roleClaim||'smd_role']||'').toLowerCase();
  const allowed=(role,cfg)=>(cfg?.cloudAdmin?.allowedRoles||['owner','admin']).map(x=>String(x).toLowerCase()).includes(String(role||'').toLowerCase());
  async function verifiedCloudRole(){
    const cfg=await loadConfig();
    if(!cfg?.cloudAdmin?.enabled)return {enabled:false,authorized:false,role:'',reason:'Cloud admin is disabled in admin-config.json.'};
    if(!window.SMD21CloudAuth)return {enabled:true,authorized:false,role:'',reason:'Cloud Auth runtime is unavailable.'};
    const st=await SMD21CloudAuth.status();
    if(!st.configured)return {enabled:true,authorized:false,role:'',reason:'Supabase/Google authentication is not configured.'};
    if(!st.connected)return {enabled:true,authorized:false,role:'',reason:'No verified cloud session is connected.'};
    let user=st.session?.user||{};
    if(window.SMD21CloudAuth.getVerifiedUser){try{user=await SMD21CloudAuth.getVerifiedUser()}catch(err){return {enabled:true,authorized:false,role:'',reason:err.message||'Cloud user verification failed.'}}}
    const role=roleFromUser(user,cfg);
    return {enabled:true,configured:true,connected:true,authorized:allowed(role,cfg),role,user,config:cfg,authStatus:st,reason:allowed(role,cfg)?'Verified cloud admin role.':'Connected account does not have an owner/admin app_metadata role.'};
  }
  function setMode(mode){sessionStorage.setItem(ADMIN_MODE,mode)}
  function mode(){return sessionStorage.getItem(ADMIN_MODE)||'local'}
  function clearMode(){sessionStorage.removeItem(ADMIN_MODE)}
  window.SMD21AdminAuth={loadConfig,verifiedCloudRole,setMode,mode,clearMode,roleFromUser,allowed,ADMIN_MODE};
})();
