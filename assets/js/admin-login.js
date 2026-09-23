(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const params=new URLSearchParams(location.search);
  const requested=params.get('panel')||sessionStorage.getItem('smd_private_admin_panel')||'medical-dictionary';
  const panel=requested==='suhail-labs'?'suhail-labs':'medical-dictionary';
  sessionStorage.setItem('smd_private_admin_panel',panel);
  const title=panel==='suhail-labs'?'Suhail Labs':'Suhail Medical Dictionary';
  $('#targetProject').textContent=title;
  const status=(m,state='')=>{const e=$('#adminLoginStatus');if(e){e.textContent=m;e.className='admin-status '+state}};
  if(!window.SMD21Auth||!SMD21Auth.isReady()){
    status('Opening the account page first…');
    location.replace('index.html?return='+encodeURIComponent('admin-login.html'));
    return;
  }
  async function openOwner(chooseAnother=false){
    try{
      const cloud=await SMD21CloudAuth.status();
      if(chooseAnother||!cloud.connected){
        status('Opening verified Google owner sign-in…');
        await SMD21CloudAuth.startGoogleSignIn('admin.html?panel='+encodeURIComponent(panel),{chooseAnother});
        return;
      }
      const role=await SMD21AdminAuth.verifiedCloudRole();
      if(!role.authorized){
        try{await SMD21CloudAuth.signOutRemote?.()}catch{}
        status(role.reason||'Only SuhailSaeedy@gmail.com can open this private console.','bad');
        return
      }
      status('Verified owner access. Opening private console…','ok');
      location.href='admin.html?panel='+encodeURIComponent(panel);
    }catch(err){status(err.message||String(err),'bad')}
  }
  $('#verifyCloudAdmin')?.addEventListener('click',()=>openOwner(false));
  $('#useOtherAccount')?.addEventListener('click',()=>openOwner(true));
  (async()=>{try{
    const r=await SMD21AdminAuth.verifiedCloudRole();
    if(!r.authorized&&r.connected){try{await SMD21CloudAuth.signOutRemote?.()}catch{}}
    status(r.authorized?'Verified owner session is ready.':r.reason||'Sign in to continue.',r.authorized?'ok':'')
  }catch(err){status(err.message||String(err),'bad')}})();
})();
