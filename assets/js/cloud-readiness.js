(() => {
  const $=s=>document.querySelector(s);
  const clean=v=>String(v||'').trim().replace(/\/+$/,'');
  const secretish=k=>/service[_-]?role|secret/i.test(String(k||''));
  const set=(id,text,cls='')=>{const e=$(id);if(!e)return;e.textContent=text;e.className=cls};
  const status=(msg,ok=false)=>{const e=$('#cloudReadinessStatus');if(!e)return;e.textContent=msg;e.classList.toggle('ok',ok)};
  function callbackUrl(c){return new URL(c.redirectPath||'auth-callback.html',location.href).href.split('#')[0]}
  async function authSettings(c){
    const base=clean(c.supabaseUrl);if(!base)return null;
    const r=await fetch(`${base}/auth/v1/settings`,{headers:{apikey:String(c.publishableKey||'')},cache:'no-store'});
    const body=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(body?.msg||body?.message||`Supabase Auth returned HTTP ${r.status}`);
    return body;
  }
  function validate(c){
    const problems=[];const url=clean(c?.supabaseUrl),key=String(c?.publishableKey||'').trim();
    if(!c?.enabled)problems.push('Cloud auth is disabled.');
    if(!url)problems.push('Supabase URL is blank.');
    else{try{const u=new URL(url);if(u.protocol!=='https:'&&u.hostname!=='localhost')problems.push('Supabase URL should use HTTPS.')}catch{problems.push('Supabase URL is invalid.')}}
    if(!key)problems.push('Publishable key is blank.');
    if(secretish(key)||key.startsWith('sb_secret_'))problems.push('A secret/service-role key must never be used in browser config.');
    if(c?.security?.allowServiceRoleInBrowser!==false)problems.push('allowServiceRoleInBrowser must be false.');
    return problems;
  }
  async function run(){
    const badge=$('#cloudReadinessBadge');if(!badge||!window.SMD21CloudAuth)return;
    badge.textContent='Checking…';badge.className='cloud-badge warn';status('Running safe public configuration checks…');
    let c;try{c=await SMD21CloudAuth.config()}catch(e){status(e.message);return}
    const cb=callbackUrl(c);$('#cloudCallbackUrl').textContent=cb;set('#readyCallback','Ready','ok');
    const problems=validate(c);set('#readyConfig',problems.length?'Needs setup':'Valid',problems.length?'warn':'ok');
    set('#readySync',c?.sync?.enabled&&c?.sync?.table?'Configured':'Disabled',c?.sync?.enabled?'ok':'warn');
    if(problems.length){set('#readyAuth','Not tested','warn');set('#readyGoogle','Not tested','warn');badge.textContent='Needs setup';badge.className='cloud-badge warn';status(problems.join(' '));return}
    try{
      const a=await authSettings(c);set('#readyAuth','Reachable','ok');
      const google=!!(a?.external?.google ?? a?.external?.['google']);set('#readyGoogle',google?'Enabled':'Not enabled',google?'ok':'warn');
      badge.textContent=google?'Ready':'Provider setup needed';badge.className='cloud-badge '+(google?'ok':'warn');
      status(google?'Public Supabase configuration is reachable and Google provider is enabled. You can test Connect Google now.':'Supabase Auth is reachable, but Google provider does not appear enabled yet.',google);
    }catch(e){set('#readyAuth','Failed','bad');set('#readyGoogle','Unknown','warn');badge.textContent='Connection failed';badge.className='cloud-badge warn';status(e.message||String(e));}
  }
  const btn=$('#runCloudReadiness');if(!btn)return;
  btn.addEventListener('click',run);
  $('#copyCloudCallback')?.addEventListener('click',async()=>{const t=$('#cloudCallbackUrl')?.textContent||'';if(!t||t==='—')return;try{await navigator.clipboard.writeText(t);status('Callback URL copied.',true)}catch{status('Copy was blocked by the browser. Select and copy the callback URL manually.')}});
  SMD21CloudAuth.config().then(c=>{$('#cloudCallbackUrl').textContent=callbackUrl(c)}).catch(()=>{});
})();
