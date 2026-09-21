(()=>{
  const AUTH='smd-auth-v5',PROFILE='smd-local-profile-v1',CONSENTS='smd-privacy-consents-v1';
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const s=read(AUTH),p=read(PROFILE),map=read(CONSENTS)||{},id=String(s?.user?.id||s?.user?.email||'').trim().toLowerCase();
  const ok=!!(id&&(map[id]||(s?.local_only&&p?.privacy_ack_at)));
  const fromConsent=new URLSearchParams(location.search).get('from')==='consent'||!ok;
  if(fromConsent){
    document.body.classList.add('v20-consent-review-mode');
    document.querySelectorAll('a[href^="./app.html"],a[href="./anatomy.html"],a[href="./ai.html"],a[href="./offline.html"]').forEach(a=>{a.href='./index.html?consent=1';const span=a.querySelector('span');if((a.textContent||'').toLowerCase().includes('dictionary')){if(span)span.textContent='Back to account setup';else a.innerHTML='<i class="bi bi-arrow-left me-2"></i>Back to account setup';}});
    const actions=document.querySelector('.v20-legal-actions');if(actions&&!actions.querySelector('.v20-consent-help')){const n=document.createElement('p');n.className='v20-consent-help';n.innerHTML='<i class="bi bi-shield-check"></i> Return to account setup, check the Privacy & Terms box, then continue.';actions.appendChild(n);}
  }
})();
