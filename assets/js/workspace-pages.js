(() => {
  if(!window.SMD21Auth || !SMD21Auth.guard()) return;
  const $=s=>document.querySelector(s);
  const account=SMD21Auth.getAccount()||{email:'local'};
  const accountKey=encodeURIComponent(String(account.email||'local').toLowerCase());
  const LEGACY_KEYS=['smd21_selected','smd21_bookmarks','smd21_history'];
  const safeArray=(key)=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return []}};
  const profileKeys={selected:SMD21Auth.scopedKey('selected'),bookmarks:SMD21Auth.scopedKey('bookmarks'),history:SMD21Auth.scopedKey('history')};
  const toast=(m)=>{const t=$('#workspaceToast');if(!t)return;t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),1800)};
  function bindShell(){
    $('#accountEmail').textContent=account.email||'Local account';
    $('#signOutBtn').addEventListener('click',async()=>{await SMD21Auth.signOut();location.href='index.html'});
    $('#mobileMenu').addEventListener('click',()=>{$('#sidebar').classList.toggle('open');$('#drawerBackdrop').classList.toggle('show')});
    $('#drawerBackdrop').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#drawerBackdrop').classList.remove('show')});
    $('#topSearch').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.currentTarget.value.trim()){sessionStorage.setItem('smd21_pending_search',e.currentTarget.value.trim());location.href='app.html#dictionary'}});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#topSearch').focus()}if(e.key==='Escape'){$('#sidebar').classList.remove('open');$('#drawerBackdrop').classList.remove('show')}});
  }
  function currentChatKey(){return `smd21_ai_chats_${accountKey}`}
  function refreshCounts(){
    const ids={selectedCount:safeArray(profileKeys.selected).length,bookmarkCount:safeArray(profileKeys.bookmarks).length,historyCount:safeArray(profileKeys.history).length,chatCount:safeArray(currentChatKey()).length};
    Object.entries(ids).forEach(([id,n])=>{const el=$(`#${id}`);if(el)el.textContent=String(n)});
  }
  function clearKey(key,msg){localStorage.removeItem(key);refreshCounts();const s=$('#dataStatus');if(s){s.textContent=msg;s.classList.add('ok')}toast(msg)}
  function initSettings(){
    $('#columnsSetting').value=localStorage.getItem('smd21_cols')||'3';
    $('#columnsSetting').addEventListener('change',e=>{localStorage.setItem('smd21_cols',e.target.value);SMD21Auth.touchProfile();toast('Dictionary layout saved')});
    $('#clearSelected').addEventListener('click',()=>{clearKey(profileKeys.selected,'Selected terms cleared.');SMD21Auth.touchProfile()});
    $('#clearBookmarks').addEventListener('click',()=>{clearKey(profileKeys.bookmarks,'Bookmarks cleared.');SMD21Auth.touchProfile()});
    $('#clearHistory').addEventListener('click',()=>{clearKey(profileKeys.history,'History cleared.');SMD21Auth.touchProfile()});
    $('#clearChats').addEventListener('click',()=>{clearKey(currentChatKey(),'AI Study chats cleared for this account.');SMD21Auth.touchProfile()});
    $('#clearAllStudyData').addEventListener('click',()=>{if(!confirm('Clear Selected Terms, Bookmarks, History and local AI chats for this account?'))return;[profileKeys.selected,profileKeys.bookmarks,profileKeys.history,currentChatKey()].forEach(k=>localStorage.removeItem(k));SMD21Auth.touchProfile();refreshCounts();$('#dataStatus').textContent='All local study data cleared.';$('#dataStatus').classList.add('ok');toast('Local study data cleared')});
    $('#resetPreferences').addEventListener('click',()=>{SMD21.setTheme('dark');SMD21.setLang('en');SMD21.setMotion('auto');SMD21.setFontScale(100);localStorage.setItem('smd21_cols','3');SMD21Auth.touchProfile();$('#columnsSetting').value='3';$('#preferenceStatus').textContent='Interface preferences reset.';$('#preferenceStatus').classList.add('ok');toast('Preferences reset')});
    refreshCounts();
  }

  async function initCloud(){
    const badge=$('#cloudBadge'),title=$('#cloudAccountTitle'),detail=$('#cloudAccountDetail'),statusEl=$('#cloudStatus');
    const connect=$('#connectGoogle'),pull=$('#pullCloud'),push=$('#pushCloud'),disconnect=$('#disconnectCloud');
    if(!badge||!window.SMD21CloudAuth)return;
    const setStatus=(m,ok=false)=>{statusEl.textContent=m;statusEl.classList.toggle('ok',ok)};
    async function refresh(){
      let st;try{st=await SMD21CloudAuth.status()}catch(err){setStatus(err.message);return}
      const syncEnabled=!!st.config?.sync?.enabled;
      badge.className='cloud-badge '+(st.connected?'connected':st.configured?'':'disabled');
      badge.textContent=st.connected?'Connected':st.configured?'Ready to connect':'Not configured';
      connect.disabled=!st.configured;disconnect.disabled=!st.connected;pull.disabled=!(st.connected&&syncEnabled);push.disabled=!(st.connected&&syncEnabled);
      if(st.connected){title.textContent=st.session.user.email||account.email;detail.textContent=syncEnabled?'Google account verified · cloud sync available':'Google account verified · sync disabled in auth-config.json';}
      else if(st.configured){title.textContent='Google sign-in available';detail.textContent='Connect this browser session to enable the configured account flow.';}
      else{title.textContent='Local account only';detail.textContent='Set data/auth-config.json to enable optional Google/Supabase features.';}
    }
    connect.addEventListener('click',async()=>{try{await SMD21CloudAuth.startGoogleSignIn('settings.html')}catch(err){setStatus(err.message)}});
    disconnect.addEventListener('click',async()=>{try{await SMD21CloudAuth.signOutRemote();SMD21Auth.saveAccount(account.email,'local');setStatus('Cloud session disconnected. Local profile remains on this browser.',true);await refresh()}catch(err){setStatus(err.message)}});
    pull.addEventListener('click',async()=>{pull.disabled=true;setStatus('Pulling and merging cloud state…');try{const r=await SMD21CloudSync.pull();refreshCounts();setStatus(r.found?'Cloud state merged with this account.':'No cloud snapshot exists yet. Local data was not changed.',true)}catch(err){setStatus(err.message)}finally{await refresh()}});
    push.addEventListener('click',async()=>{push.disabled=true;setStatus('Uploading this account snapshot…');try{await SMD21CloudSync.push();setStatus('Cloud snapshot saved for this authenticated account.',true)}catch(err){setStatus(err.message)}finally{await refresh()}});
    await refresh();
  }

  async function initAbout(){try{const r=await fetch('version.json',{cache:'no-store'});if(r.ok){const v=await r.json();$('#versionChip').textContent=`v${v.version||'21'}`}}catch{}}
  bindShell();
  const page=document.body.dataset.workspacePage;if(page==='settings'){initSettings();initCloud()}if(page==='about')initAbout();
})();
