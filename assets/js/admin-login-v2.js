(() => {
  'use strict';
  const $=s=>document.querySelector(s),panel='medical-dictionary';
  const VERIFIED='smd_private_admin_verified_v3:medical-dictionary';
  const PENDING='smd_private_admin_oauth_pending_v3:medical-dictionary';
  const params=new URLSearchParams(location.search);
  if(params.get('panel')==='suhail-labs'){location.replace('/suhail-labs/admin-login.html');return}
  $('#targetProject').textContent='Suhail Medical Dictionary';
  const status=(m,state='')=>{const e=$('#adminLoginStatus');if(e){e.textContent=m;e.className='admin-status '+state}};
  const setGate=auth=>sessionStorage.setItem(VERIFIED,JSON.stringify({panel,userId:auth.user?.id||'',verifiedAt:Date.now()}));
  async function fail(message='Sign-in failed. This account is not authorized for private administration.'){
    sessionStorage.removeItem(VERIFIED);sessionStorage.removeItem(PENDING);
    try{await SMD21CloudAuth.signOutRemote()}catch{}
    status(message,'bad');
  }
  async function redirectBlocked(){
    sessionStorage.removeItem(VERIFIED);sessionStorage.removeItem(PENDING);
    try{await SMD21CloudAuth.signOutRemote()}catch{}
    location.replace('/suhail-medical-dictionary/app.html#dictionary');
  }
  async function openIfCurrentSessionIsOwner(){
    try{
      const auth=await SMD21AdminAuth.verifiedCloudRole();
      if(auth.blocked){await redirectBlocked();return true}
      if(auth.authorized&&auth.authStatus?.source==='session'){
        setGate(auth);
        status('Verified owner session. Opening Medical Dictionary Admin…','ok');
        location.replace('admin.html');
        return true;
      }
    }catch{}
    return false;
  }
  async function complete(){
    if(params.get('oauth')==='return'&&sessionStorage.getItem(PENDING)===panel){
      try{
        const auth=await SMD21AdminAuth.verifiedCloudRole();
        if(auth.blocked){await redirectBlocked();return}
        if(!auth.authorized||auth.authStatus?.source!=='session'){await fail();return}
        setGate(auth);sessionStorage.removeItem(PENDING);
        status('Sign-in verified. Opening Medical Dictionary Admin…','ok');
        location.replace('admin.html');
      }catch{await fail('Sign-in could not be verified. Please try again.')}
      return;
    }
    if(await openIfCurrentSessionIsOwner())return;
    sessionStorage.removeItem(VERIFIED);sessionStorage.removeItem(PENDING);
    status('Sign in with Google to continue.');
  }
  async function begin(){
    sessionStorage.removeItem(VERIFIED);sessionStorage.setItem(PENDING,panel);
    try{
      SMD21Auth.saveConsent?.();
      await SMD21CloudAuth.startGoogleSignIn('/suhail-medical-dictionary/admin-login.html?oauth=return',{chooseAnother:true,sessionOnly:true});
    }catch{
      sessionStorage.removeItem(PENDING);
      status('Secure Google sign-in could not be started. Please try again.','bad');
    }
  }
  $('#verifyCloudAdmin')?.addEventListener('click',begin);
  complete();
})();