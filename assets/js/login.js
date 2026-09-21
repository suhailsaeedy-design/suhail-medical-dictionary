(() => {
  const q=s=>document.querySelector(s);
  let account=SMD21Auth.getAccount();
  let cloudReady=false;
  let cloudStatus=null;
  const requestedReturn=new URLSearchParams(location.search).get('return')||'';
  const safeReturns=new Set(['app.html#dictionary','anatomy.html','ai.html','offline.html','about.html','settings.html','admin-login.html']);
  const returnTarget=safeReturns.has(requestedReturn)?requestedReturn:'app.html#dictionary';
  const current=q('#currentAccountBtn'), currentEmail=q('#currentEmail');
  const privacy=q('#privacyCheck'), terms=q('#termsCheck'), consentNote=q('#consentNote');
  const authModeStatus=q('#authModeStatus');
  if(account?.email){current.disabled=false;currentEmail.textContent=account.email;} else {current.disabled=true;currentEmail.textContent='No saved account on this device';}
  function canContinue(){return privacy.checked&&terms.checked}
  function updateConsent(){consentNote.textContent=canContinue()?'Privacy and Terms accepted for this sign-in.':'Accept Privacy and Terms before continuing.';consentNote.style.color='';}
  privacy.addEventListener('change',updateConsent);terms.addEventListener('change',updateConsent);
  function requireConsent(){if(canContinue())return true;consentNote.textContent='Please check both Privacy Notice and Terms of Use first.';consentNote.style.color='#b92e4c';return false;}
  function proceed(email,provider='local',extra={}){if(!requireConsent())return;SMD21Auth.saveAccount(email,provider,extra);SMD21Auth.saveConsent();location.href=returnTarget;}
  async function beginGoogle(chooseAnother=false){
    if(!requireConsent())return;
    SMD21Auth.saveConsent();
    try{await SMD21CloudAuth.startGoogleSignIn(returnTarget,{chooseAnother})}catch(err){consentNote.textContent=err.message;consentNote.style.color='#b92e4c';}
  }
  current.addEventListener('click',async()=>{
    account=SMD21Auth.getAccount();if(!account?.email||!requireConsent())return;
    if(account.provider==='google'&&cloudReady){const s=await SMD21CloudAuth.getValidSession();if(!s){await beginGoogle(false);return;}}
    proceed(account.email,account.provider||'local',{id:account.id,cloud:account.cloud===true});
  });
  q('#otherAccountBtn').addEventListener('click',async()=>{if(!requireConsent())return;if(cloudReady){await beginGoogle(true);return;}q('#emailModal').classList.remove('hidden');});
  q('#closeEmailModal').addEventListener('click',()=>q('#emailModal').classList.add('hidden'));
  q('#localEmailForm').addEventListener('submit',e=>{e.preventDefault();const email=q('#otherEmail').value.trim();if(!/^\S+@\S+\.\S+$/.test(email)){q('#emailError').textContent='Enter a valid email address.';return;}q('#emailModal').classList.add('hidden');proceed(email,'local');});
  SMD21CloudAuth.status().then(st=>{cloudStatus=st;cloudReady=st.configured;if(authModeStatus)authModeStatus.textContent=cloudReady?'Google sign-in is configured. “Other email” opens the Google account chooser.':'Local account mode active. Optional Google/Supabase sign-in is not configured.';const sub=q('#otherAccountBtn small');if(sub)sub.textContent=cloudReady?'Choose another Google account':'Choose another email for this device';}).catch(()=>{});
})();
