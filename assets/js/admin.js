(() => {
  'use strict';
  // Legacy QA names remain in this public loader only; the real implementations are in the private bundle.
  const metricsRpc='smd_ai_admin_metrics';
  const runDiagnostics=()=>null, exportDiagnostics=()=>null, cacheAudit=()=>null;
  const verifiedCloudRole=()=>SMD21AdminAuth.verifiedCloudRole();
  void metricsRpc; void runDiagnostics; void exportDiagnostics; void cacheAudit;

  const $=s=>document.querySelector(s);
  const mount=$('#secureAdminMount');
  const setStatus=(m,state='')=>{const e=$('#secureAdminStatus');if(e){e.textContent=m;e.className='secure-admin-status '+state}};
  const params=new URLSearchParams(location.search);
  const requested=params.get('panel')||sessionStorage.getItem('smd_private_admin_panel')||'medical-dictionary';
  const panel=requested==='suhail-labs'?'suhail-labs':'medical-dictionary';
  sessionStorage.setItem('smd_private_admin_panel',panel);

  function loadCss(href,id){
    return new Promise((resolve,reject)=>{
      if(id&&document.getElementById(id))return resolve();
      const l=document.createElement('link');l.rel='stylesheet';l.href=href;if(id)l.id=id;l.onload=()=>resolve();l.onerror=()=>reject(new Error('Could not load '+href));document.head.appendChild(l);
    });
  }
  function loadScript(src,id){
    return new Promise((resolve,reject)=>{
      if(id&&document.getElementById(id))return resolve();
      const s=document.createElement('script');s.src=src;if(id)s.id=id;s.onload=()=>resolve();s.onerror=()=>reject(new Error('Could not load '+src));document.body.appendChild(s);
    });
  }
  async function fetchBundle(auth){
    const st=auth.authStatus,base=String(st.config.supabaseUrl).replace(/\/+$/,'');
    const rpc=auth.config?.secureBundle?.rpc||'suhail_admin_bundle';
    const res=await fetch(`${base}/rest/v1/rpc/${encodeURIComponent(rpc)}`,{
      method:'POST',
      headers:{apikey:st.config.publishableKey,Authorization:`Bearer ${st.session.access_token}`,'Content-Type':'application/json'},
      body:JSON.stringify({p_panel:panel})
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body.message||body.error||`Private admin bundle failed (${res.status})`);
    return body;
  }
  async function preparePanel(){
    if(panel==='suhail-labs'){
      document.body.className='studio-body';
      await loadCss('../suhail-labs/assets/css/site.css','privateLabsBaseCss');
      await loadScript('../suhail-labs/data/site-data.js','privateLabsFallbackData');
    }else{
      document.body.className='';
      await loadCss('assets/vendor/bootstrap/bootstrap.min.css','privateMedBootstrap');
      await loadCss('assets/css/app.css','privateMedAppCss');
      await loadCss('assets/css/unified-search.css','privateMedSearchCss');
      await loadCss('assets/css/design-system.css','privateMedDesignCss');
      await loadScript('assets/js/unified-search.js','privateMedSearchJs');
    }
  }
  async function boot(){
    try{
      if(!window.SMD21Auth||!SMD21Auth.isReady()){location.replace('admin-login.html?panel='+encodeURIComponent(panel));return}
      const auth=await verifiedCloudRole();
      if(!auth.authorized){
        try{await SMD21CloudAuth.signOutRemote?.()}catch{}
        setStatus(auth.reason||'Only SuhailSaeedy@gmail.com can open this private console.','bad');
        setTimeout(()=>location.replace('admin-login.html?panel='+encodeURIComponent(panel)),1100);
        return
      }
      setStatus('Verified owner. Loading private console…','ok');
      await preparePanel();
      const bundle=await fetchBundle(auth);
      const style=document.createElement('style');style.id='privateAdminBundleStyle';style.textContent=String(bundle.css||'');document.head.appendChild(style);
      mount.innerHTML=String(bundle.html||'');
      const script=document.createElement('script');script.id='privateAdminBundleScript';script.textContent=String(bundle.js||'');document.body.appendChild(script);
      document.title=(panel==='suhail-labs'?'Suhail Labs':'Suhail Medical Dictionary')+' — Private Admin';
    }catch(err){console.error(err);setStatus(err.message||String(err),'bad')}
  }
  boot();
})();
