(() => {
  const ACCOUNT='smd21_account';
  const CONSENT='smd21_consent';
  const CLOUD_SESSION='smd21_cloud_session';
  const LEGACY_PROFILE_KEYS={selected:'smd21_selected',bookmarks:'smd21_bookmarks',history:'smd21_history'};
  const read=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const getAccount=()=>read(ACCOUNT);
  const getConsent=()=>read(CONSENT);
  const normalizeEmail=(email)=>String(email||'local').trim().toLowerCase();
  const accountKey=(account=getAccount())=>encodeURIComponent(normalizeEmail(account?.email));
  const scopedKey=(name,account=getAccount())=>`smd21_${name}_${accountKey(account)}`;
  const isReady=()=>!!(getAccount()?.email && getConsent()?.privacy===true && getConsent()?.terms===true);
  function saveAccount(email,provider='local',extra={}){
    const previous=getAccount();
    write(ACCOUNT,{email:normalizeEmail(email),provider,...extra,created_at:previous?.created_at||new Date().toISOString(),updated_at:new Date().toISOString()});
    migrateLegacyProfileData();
  }
  function saveConsent(){write(CONSENT,{privacy:true,terms:true,accepted_at:new Date().toISOString()});}
  function guard(){if(!isReady()){location.replace('index.html?return='+encodeURIComponent(location.pathname.split('/').pop()||'app.html'));return false}migrateLegacyProfileData();return true;}
  function migrateLegacyProfileData(){
    const account=getAccount();if(!account?.email)return;
    Object.entries(LEGACY_PROFILE_KEYS).forEach(([name,legacy])=>{
      const target=scopedKey(name,account);
      if(localStorage.getItem(target)==null&&localStorage.getItem(legacy)!=null){localStorage.setItem(target,localStorage.getItem(legacy));localStorage.removeItem(legacy);}
    });
  }
  function touchProfile(){try{localStorage.setItem(scopedKey('profile_updated'),new Date().toISOString())}catch{}}
  function profileUpdatedAt(){return localStorage.getItem(scopedKey('profile_updated'))||null;}
  async function signOut(){
    try{if(window.SMD21CloudAuth?.signOutRemote)await window.SMD21CloudAuth.signOutRemote();}catch(err){console.warn('Remote sign-out failed:',err)}
    localStorage.removeItem(ACCOUNT);sessionStorage.removeItem(CLOUD_SESSION);
  }
  function cloudSession(){try{return JSON.parse(sessionStorage.getItem(CLOUD_SESSION)||'null')}catch{return null}}
  window.SMD21Auth={ACCOUNT,CONSENT,CLOUD_SESSION,getAccount,getConsent,isReady,saveAccount,saveConsent,guard,accountKey,scopedKey,migrateLegacyProfileData,touchProfile,profileUpdatedAt,signOut,cloudSession};
})();
