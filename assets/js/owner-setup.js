(() => {
  if(!window.SMD21Auth||!SMD21Auth.isReady()){location.replace('index.html?return='+encodeURIComponent('owner-setup.html'));return}
  const $=s=>document.querySelector(s);
  const set=(id,text,state='')=>{const e=$(id);if(!e)return;e.textContent=text;e.className='health-state '+state};
  const status=(m,state='')=>{const e=$('#ownerStatus');e.textContent=m;e.className='admin-status '+state};
  const gateStatus=(m,state='')=>{const e=$('#publishGateStatus');e.textContent=m;e.className='admin-status '+state};
  const clean=v=>String(v||'').replace(/\/+$/,'');
  const headers=st=>({apikey:st.config.publishableKey,Authorization:`Bearer ${st.session.access_token}`,'Content-Type':'application/json'});
  async function jsonFetch(url,opts={}){const r=await fetch(url,opts);const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b?.message||b?.msg||b?.error_description||`HTTP ${r.status}`);return b}
  async function cloud(){const st=await SMD21CloudAuth.status();return st}
  async function connect(){const st=await cloud();if(st.connected)return st;status('Opening Google account verification…');await SMD21CloudAuth.startGoogleSignIn('owner-setup.html');return null}
  async function claim(){
    const code=$('#ownerBootstrapCode').value.trim();if(!code){status('Enter the separate one-time bootstrap code.','bad');return}
    const st=await cloud();if(!st.configured){status('Cloud authentication is not configured.','bad');return}if(!st.connected){await connect();return}
    $('#claimOwnerRole').disabled=true;status('Claiming owner role…');
    try{
      const base=clean(st.config.supabaseUrl);
      await jsonFetch(`${base}/rest/v1/rpc/smd_claim_owner`,{method:'POST',headers:headers(st),body:JSON.stringify({p_token:code})});
      $('#ownerBootstrapCode').value='';
      await SMD21CloudAuth.refreshSession();
      const user=await SMD21CloudAuth.getVerifiedUser();
      if(String(user?.app_metadata?.smd_role||'').toLowerCase()!=='owner')throw new Error('Owner claim completed but the refreshed role was not returned. Sign out and reconnect Google once.');
      status('Owner role verified. The one-time bootstrap code is now invalid.','ok');
      await runGate();
    }catch(e){status(e.message||String(e),'bad')}finally{$('#claimOwnerRole').disabled=false}
  }
  async function runGate(){
    let pass=true,st,cfg,adminCfg,user=null;
    try{st=await cloud();cfg=st.config;const safe=!!(st.configured&&cfg?.security?.allowServiceRoleInBrowser===false&&String(cfg?.publishableKey||'').startsWith('sb_publishable_'));set('#gateConfig',safe?'Safe':'Needs review',safe?'ok':'bad');pass&&=safe}catch(e){set('#gateConfig','Failed','bad');pass=false}
    const connected=!!st?.connected;set('#gateSession',connected?'Connected':'Not connected',connected?'ok':'warn');pass&&=connected;
    if(connected){try{user=await SMD21CloudAuth.getVerifiedUser();$('#ownerAccount').textContent=`Verified Google account: ${user.email||user.id}`;}catch(e){pass=false;set('#gateSession','Verification failed','bad')}}else{$('#ownerAccount').textContent='No verified cloud account connected.'}
    let syncOK=false;
    if(connected&&cfg?.sync?.enabled&&cfg?.sync?.table){try{const base=clean(cfg.supabaseUrl),uid=encodeURIComponent(st.session.user.id),table=encodeURIComponent(cfg.sync.table);await jsonFetch(`${base}/rest/v1/${table}?user_id=eq.${uid}&select=user_id`,{headers:headers(st),cache:'no-store'});syncOK=true}catch(e){syncOK=false}}
    set('#gateSync',syncOK?'RLS reachable':'Not verified',syncOK?'ok':'warn');pass&&=syncOK;
    const role=String(user?.app_metadata?.smd_role||'').toLowerCase();const owner=role==='owner';set('#gateRole',owner?'Owner':'Not owner',owner?'ok':'warn');pass&&=owner;
    try{adminCfg=await fetch('data/admin-config.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Admin config load failed')));const a=!!adminCfg?.cloudAdmin?.enabled;set('#gateAdmin',a?'Enabled':'Disabled',a?'ok':'bad');pass&&=a}catch(e){set('#gateAdmin','Failed','bad');pass=false}
    let metricsOK=false;
    if(owner&&adminCfg?.cloudAdmin?.enabled){try{const base=clean(cfg.supabaseUrl),rpc=encodeURIComponent(adminCfg.cloudAdmin.metricsRpc||'smd_admin_metrics');await jsonFetch(`${base}/rest/v1/rpc/${rpc}`,{method:'POST',headers:headers(st),body:'{}'});metricsOK=true}catch(e){metricsOK=false}}
    set('#gateMetrics',metricsOK?'Authorized':'Not authorized',metricsOK?'ok':'warn');pass&&=metricsOK;
    const open=$('#openAdminConsole');open.setAttribute('aria-disabled',pass?'false':'true');open.style.pointerEvents=pass?'':'none';open.style.opacity=pass?'1':'.55';
    gateStatus(pass?'PUBLISH GATE PASS — cloud owner/admin checks are green.':'Publish gate is blocked until every cloud/owner check is green.',pass?'ok':'bad');
    return pass;
  }
  $('#connectOwnerGoogle').addEventListener('click',connect);$('#claimOwnerRole').addEventListener('click',claim);$('#refreshPublishGate').addEventListener('click',runGate);
  (async()=>{const st=await cloud();if(st.connected){try{const u=await SMD21CloudAuth.getVerifiedUser();$('#ownerAccount').textContent=`Verified Google account: ${u.email||u.id}`;status('Cloud account connected. Verify or claim Owner role.','ok')}catch(e){status(e.message||String(e),'bad')}}else{status(st.configured?'Connect the Google account that should become Owner.':'Cloud auth is not configured.','')};await runGate()})().catch(e=>status(e.message||String(e),'bad'));
})();
