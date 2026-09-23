(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const VERIFIED='smd_private_admin_verified_v2',PENDING='smd_private_admin_oauth_pending_v2';
  const params=new URLSearchParams(location.search),requested=params.get('panel')||'medical-dictionary';
  if(requested==='suhail-labs'){location.replace('/suhail-labs/admin-login.html');return}
  const panel='medical-dictionary';
  $('#targetProject').textContent='Suhail Medical Dictionary';
  const status=(m,state='')=>{const e=$('#adminLoginStatus');if(e){e.textContent=m;e.className='admin-status '+state}};
  async function fail(message='Sign-in failed. This account is not authorized for private administration.'){
    sessionStorage.removeItem(VERIFIED);sessionStorage.removeItem(PENDING);
    try{await SMD21CloudAuth.signOutRemote()}catch{}
    status(message,'bad');
  }
  async function completeOAuthReturn(){
    if(params.get('oauth')!=='return'||sessionStorage.getItem(PENDING)!==panel){status('Sign in with Google to continue.');return}
    try{
      const auth=await SMD21AdminAuth.verifiedCloudRole();
      if(!auth.authorized){await fail();return}
      sessionStorage.setItem(VERIFIED,JSON.stringify({panel,userId:auth.user?.id||'',verifiedAt:Date.now()}));
      sessionStorage.removeItem(PENDING);
      status('Sign-in verified. Opening private administration…','ok');
      location.replace('admin.html?panel='+encodeURIComponent(panel));
    }catch{await fail('Sign-in could not be verified. Please try again.')}
  }
  async function begin(){
    sessionStorage.removeItem(VERIFIED);sessionStorage.setItem(PENDING,panel);
    try{SMD21Auth.saveConsent?.();await SMD21CloudAuth.startGoogleSignIn('admin-login.html?panel='+encodeURIComponent(panel)+'&oauth=return',{chooseAnother:true,sessionOnly:true})}
    catch{sessionStorage.removeItem(PENDING);status('Secure Google sign-in could not be started. Please try again.','bad')}
  }
  $('#verifyCloudAdmin')?.addEventListener('click',begin);
  $('#useOtherAccount')?.addEventListener('click',begin);
  completeOAuthReturn();
})();