(() => {
  if(!window.SMD21Auth||!SMD21Auth.guard())return;
  const $=s=>document.querySelector(s);
  const account=SMD21Auth.getAccount()||{email:'local'};
  const safeJson=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`${url}: HTTP ${r.status}`);return r.json()};
  const safeArray=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
  const fmt=n=>new Intl.NumberFormat().format(Number(n||0));
  const health={};
  let snapshot=null;
  function setState(id,label,state='ok'){const el=$(id);if(!el)return;el.textContent=label;el.className='health-state '+state}
  function bindShell(){
    $('#accountEmail').textContent=account.email||'Local account';
    $('#signOutBtn').addEventListener('click',async()=>{await SMD21Auth.signOut();SMD21AdminAuth.clearMode();location.href='index.html'});
    $('#mobileMenu').addEventListener('click',()=>{$('#sidebar').classList.toggle('open');$('#drawerBackdrop').classList.toggle('show')});
    $('#drawerBackdrop').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#drawerBackdrop').classList.remove('show')});
    $('#topSearch').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.currentTarget.value.trim()){sessionStorage.setItem('smd21_pending_search',e.currentTarget.value.trim());location.href='app.html#dictionary'}});
  }
  async function criticalFetches(){
    const targets=['version.json','data/index.json','data/clinical-reference.json','data/anatomy/catalog.json','data/offline-packs.json','manifest.webmanifest','sw.js','data/auth-config.json','data/ai-config.json','data/admin-config.json'];
    const results=await Promise.all(targets.map(async url=>{try{const r=await fetch(url,{cache:'no-store'});return {url,ok:r.ok,status:r.status,bytes:Number(r.headers.get('content-length')||0)}}catch(err){return {url,ok:false,status:0,error:String(err)}}}));
    health.critical=results;setState('#criticalState',`${results.filter(x=>x.ok).length}/${results.length} reachable`,results.every(x=>x.ok)?'ok':'bad');return results;
  }
  function relatedAudit(terms){
    const ids=new Set(terms.map(t=>t.id)),broken=[];for(const t of terms){for(const rid of t.related_term_ids||[]){if(!ids.has(rid)&&!String(rid).startsWith('ref-')&&!String(rid).startsWith('basic-anat-')&&!String(rid).startsWith('gloss-')&&!String(rid).startsWith('smd-dx-')&&!String(rid).startsWith('p11-'))broken.push({term:t.id,related:rid})}}
    return broken;
  }
  function duplicateIds(items){const seen=new Set(),dup=[];for(const x of items){if(seen.has(x.id))dup.push(x.id);seen.add(x.id)}return dup}
  function profileCounts(){
    const selected=safeArray(SMD21Auth.scopedKey('selected')).length,bookmarks=safeArray(SMD21Auth.scopedKey('bookmarks')).length,history=safeArray(SMD21Auth.scopedKey('history')).length;
    const chats=safeArray(`smd21_ai_chats_${SMD21Auth.accountKey(account)}`).length;return {selected,bookmarks,history,chats};
  }
  async function cacheAudit(packs){
    if(!('caches'in window))return {supported:false,caches:[]};
    const names=await caches.keys(),prefix=String(packs.cache_prefix||''),rows=[];for(const p of packs.packs||[]){const name=prefix+p.id;const cache=await caches.open(name);let hit=0;for(const u of p.urls||[]){if(await cache.match(u,{ignoreSearch:true}))hit++}rows.push({id:p.id,title:p.title,cached:hit,total:(p.urls||[]).length,complete:hit===(p.urls||[]).length})}return {supported:true,names,rows};
  }
  async function storageAudit(){if(!navigator.storage?.estimate)return null;try{return await navigator.storage.estimate()}catch{return null}}
  async function serviceWorkerAudit(){if(!('serviceWorker'in navigator))return {supported:false,controlled:false};try{const reg=await navigator.serviceWorker.getRegistration();return {supported:true,registered:!!reg,controlled:!!navigator.serviceWorker.controller,scope:reg?.scope||''}}catch(err){return {supported:true,error:String(err)}}}
  async function runDiagnostics(){
    $('#refreshDiagnostics').disabled=true;$('#diagStatus').textContent='Refreshing diagnostics…';
    try{
      const [version,index,clinical,anatomy,packs,authCfg,aiCfg,adminCfg]=await Promise.all(['version.json','data/index.json','data/clinical-reference.json','data/anatomy/catalog.json','data/offline-packs.json','data/auth-config.json','data/ai-config.json','data/admin-config.json'].map(safeJson));
      const terms=index.terms||[],dup=duplicateIds(terms),broken=relatedAudit(terms),profile=profileCounts(),cache=await cacheAudit(packs),storage=await storageAudit(),sw=await serviceWorkerAudit(),critical=await criticalFetches();
      const clinicalCounts={conditions:terms.filter(t=>t.reference_module==='conditions').length,procedures:terms.filter(t=>t.reference_module==='procedures').length,pharmacology:terms.filter(t=>t.reference_module==='pharmacology').length};
      const anatomyCounts={bones:anatomy.bone_count||0,muscles:anatomy.muscle_count||0,joints:anatomy.joints_count||0,ligaments:anatomy.ligaments_count||0,organs:anatomy.organs_count||0,nerves:anatomy.nerves_count||0,vessels:anatomy.vessels_count||0,teeth:anatomy.teeth_count||0,eye:anatomy.eye_count||0,sinuses:anatomy.sinuses_count||0};
      const langCoverage={en:terms.filter(t=>t.definition?.en).length,ps:terms.filter(t=>t.definition?.ps).length,fa:terms.filter(t=>t.definition?.fa).length,ar:terms.filter(t=>t.definition?.ar).length,tr:terms.filter(t=>t.definition?.tr).length,zh:terms.filter(t=>t.definition?.zh).length};
      snapshot={generatedAt:new Date().toISOString(),release:version,project:{terms:terms.length,categories:(index.categories||[]).length,clinical:clinicalCounts,anatomy:anatomyCounts,calculators:(clinical.calculators||[]).length||7},profile,localization:langCoverage,integrity:{duplicateTermIds:dup,brokenRelatedRefs:broken,criticalFiles:critical},pwa:{serviceWorker:sw,cache},storage,configuration:{auth:{enabled:!!authCfg.enabled,sync:!!authCfg.sync?.enabled,serviceRoleAllowed:authCfg.security?.allowServiceRoleInBrowser},ai:{cloudEnabled:!!aiCfg.cloud?.enabled,zeroCostMode:!!aiCfg.zeroCostMode,paidFallback:!!aiCfg.allowPaidFallback},admin:adminCfg}};
      $('#kpiTerms').textContent=fmt(terms.length);$('#kpiCategories').textContent=fmt((index.categories||[]).length);$('#kpiClinical').textContent=fmt(clinicalCounts.conditions+clinicalCounts.procedures+clinicalCounts.pharmacology);$('#kpiAnatomy').textContent=fmt(Object.values(anatomyCounts).reduce((a,b)=>a+b,0));$('#kpiSelected').textContent=fmt(profile.selected);$('#kpiChats').textContent=fmt(profile.chats);
      setState('#idState',dup.length?`${dup.length} duplicates`:'Unique IDs',dup.length?'bad':'ok');setState('#relatedState',broken.length?`${broken.length} unresolved`:'Reference links clean',broken.length?'warn':'ok');setState('#swState',sw.registered?(sw.controlled?'Active & controlling':'Registered'):'Not registered',sw.registered?'ok':'warn');setState('#cacheState',cache.supported?`${cache.rows.filter(x=>x.complete).length}/${cache.rows.length} packs complete`:'Cache API unavailable',cache.supported?'ok':'warn');setState('#securityState',authCfg.security?.allowServiceRoleInBrowser===false&&aiCfg.allowPaidFallback===false?'Browser secret/paid-fallback guards OK':'Review configuration',authCfg.security?.allowServiceRoleInBrowser===false&&aiCfg.allowPaidFallback===false?'ok':'bad');
      $('#localizationRows').innerHTML=Object.entries(langCoverage).map(([k,v])=>`<tr><td>${k.toUpperCase()}</td><td>${fmt(v)} / ${fmt(terms.length)}</td><td>${Math.round(v/terms.length*100)}%</td></tr>`).join('');
      $('#packRows').innerHTML=cache.supported?cache.rows.map(r=>`<tr><td>${r.title}</td><td>${r.cached}/${r.total}</td><td>${r.complete?'Complete':'Not complete'}</td></tr>`).join(''):'<tr><td colspan="3">Cache Storage unavailable.</td></tr>';
      $('#diagStatus').textContent=`Diagnostics refreshed · v${version.version}`;$('#diagStatus').className='admin-status ok';
      $('#exportDiagnostics').disabled=false;
    }catch(err){$('#diagStatus').textContent=err.message||String(err);$('#diagStatus').className='admin-status bad'}finally{$('#refreshDiagnostics').disabled=false}
  }
  async function cloudAdmin(){
    const box=$('#cloudAdminDetail'),badge=$('#cloudAdminBadge'),inlineBadge=$('#cloudAdminBadgeInline'),verify=$('#verifyAdminRole'),metrics=$('#loadCloudMetrics'),save=$('#saveAiQuota');
    let r;try{r=await SMD21AdminAuth.verifiedCloudRole()}catch(err){box.textContent=err.message;return}
    const label=r.authorized?`Verified ${r.role}`:r.enabled?'Not authorized':'Disabled';
    badge.textContent=label;badge.className='admin-badge '+(r.authorized?'ok':'warn');
    if(inlineBadge){inlineBadge.textContent=label;inlineBadge.className='admin-badge '+(r.authorized?'ok':'warn');}
    box.textContent=r.reason||'';metrics.disabled=!r.authorized;if(save)save.disabled=!r.authorized;verify.disabled=!r.enabled;
    return r;
  }
  function renderAiMetrics(body){
    const global=body?.global||{},perUser=body?.per_user||{};
    const used=Number(global.tokens_reserved||0),limit=Number(global.token_limit||0);
    $('#aiUsedTokens').textContent=fmt(used);
    $('#aiRemainingTokens').textContent=fmt(Math.max(0,limit-used));
    $('#aiActiveUsers').textContent=fmt(body?.active_users_today||0);
    $('#aiRequestsToday').textContent=fmt(global.requests||0);
    $('#aiEnabled').checked=body?.enabled!==false;
    $('#aiGlobalTokens').value=limit||200000;
    $('#aiGlobalRequests').value=Number(global.request_limit||900);
    $('#aiUserTokens').value=Number(perUser.token_limit||2000);
    $('#aiUserRequests').value=Number(perUser.request_limit||10);
    const reset=body?.reset_at?new Date(body.reset_at).toLocaleString():'—';
    $('#aiAdminMessage').textContent=`Daily limits reset at ${reset}. No raw prompts or other users' emails are displayed here.`;
  }
  async function adminRpc(rpc,payload={}){
    const auth=await SMD21AdminAuth.verifiedCloudRole();
    if(!auth.authorized)throw new Error(auth.reason||'Admin role is not authorized.');
    const st=auth.authStatus,base=String(st.config.supabaseUrl).replace(/\/+$/,'');
    const res=await fetch(`${base}/rest/v1/rpc/${encodeURIComponent(rpc)}`,{
      method:'POST',
      headers:{apikey:st.config.publishableKey,Authorization:`Bearer ${st.session.access_token}`,'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body.message||body.error||`Admin request failed (${res.status})`);
    return body;
  }
  async function loadMetrics(){
    const out=$('#cloudMetricsJson');out.textContent='Loading aggregate AI metrics…';
    try{
      const auth=await SMD21AdminAuth.verifiedCloudRole();
      if(!auth.authorized)throw new Error(auth.reason||'Admin role is not authorized.');
      const rpc=auth.config.cloudAdmin.metricsRpc||'smd_ai_admin_metrics';
      const body=await adminRpc(rpc,{});
      renderAiMetrics(body);
      out.textContent=JSON.stringify(body,null,2);
    }catch(err){
      out.textContent=err.message||String(err);
      $('#aiAdminMessage').textContent=err.message||String(err);
    }
  }
  async function saveAiQuota(event){
    event.preventDefault();
    const button=$('#saveAiQuota');button.disabled=true;
    $('#aiAdminMessage').textContent='Saving private AI limits…';
    try{
      const body=await adminRpc('smd_ai_admin_update_config',{
        p_enabled:$('#aiEnabled').checked,
        p_daily_global_tokens:Number($('#aiGlobalTokens').value),
        p_daily_global_requests:Number($('#aiGlobalRequests').value),
        p_daily_user_tokens:Number($('#aiUserTokens').value),
        p_daily_user_requests:Number($('#aiUserRequests').value)
      });
      renderAiMetrics(body);
      $('#cloudMetricsJson').textContent=JSON.stringify(body,null,2);
      $('#aiAdminMessage').textContent='AI limits saved securely.';
    }catch(err){
      $('#aiAdminMessage').textContent=err.message||String(err);
    }finally{
      const auth=await SMD21AdminAuth.verifiedCloudRole().catch(()=>({authorized:false}));
      button.disabled=!auth.authorized;
    }
  }
  function exportDiagnostics(){if(!snapshot)return;const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`suhail-medical-diagnostics-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  bindShell();$('#refreshDiagnostics').addEventListener('click',runDiagnostics);$('#exportDiagnostics').addEventListener('click',exportDiagnostics);$('#verifyAdminRole').addEventListener('click',async()=>{const r=await cloudAdmin();if(r?.authorized)await loadMetrics();});$('#loadCloudMetrics').addEventListener('click',loadMetrics);$('#aiQuotaForm').addEventListener('submit',saveAiQuota);runDiagnostics();cloudAdmin().then(r=>{if(r?.authorized)loadMetrics()});
})();
