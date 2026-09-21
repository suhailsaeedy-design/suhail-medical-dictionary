(() => {
  'use strict';
  const KIND='smd21-account-backup';
  const SCHEMA=1;
  const MAX_FILE=5*1024*1024;
  const MAX_LIST=500;
  const MAX_CHATS=60;
  const MAX_MESSAGES=300;
  const $=s=>document.querySelector(s);
  const safeJSON=(raw,fallback)=>{try{return JSON.parse(raw)}catch{return fallback}};
  const arr=(key)=>{const v=safeJSON(localStorage.getItem(key)||'[]',[]);return Array.isArray(v)?v:[]};
  const unique=a=>[...new Set(a.filter(v=>typeof v==='string'&&v.length<240))].slice(0,MAX_LIST);
  const account=()=>window.SMD21Auth?.getAccount?.()||null;
  const accountEmail=()=>String(account()?.email||'local').trim().toLowerCase();
  const keys=()=>({
    selected:SMD21Auth.scopedKey('selected'),
    bookmarks:SMD21Auth.scopedKey('bookmarks'),
    history:SMD21Auth.scopedKey('history'),
    chats:`smd21_ai_chats_${encodeURIComponent(accountEmail())}`
  });
  function sanitizeMessages(messages){
    if(!Array.isArray(messages))return [];
    return messages.slice(-MAX_MESSAGES).map((m,i)=>{
      const kind=['text','study'].includes(m?.kind)?m.kind:'text';
      const base={
        id:String(m?.id||`message-${i}`).slice(0,120),
        role:['user','assistant','system'].includes(m?.role)?m.role:'assistant',
        kind,
        createdAt:String(m?.createdAt||m?.created_at||'').slice(0,64)
      };
      if(kind==='study')base.payload=sanitizePayload(m?.payload);
      else base.text=String(m?.text??m?.content??'').slice(0,12000);
      return base;
    });
  }
  function sanitizePayload(payload){
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return {kind:'notice',heading:'Imported study result',body:'Saved study result data was unavailable.'};
    const str=(v,n=12000)=>String(v??'').slice(0,n);
    const ids=v=>unique(Array.isArray(v)?v:[]).slice(0,20);
    const kind=['notice','need-context','search','explain','compare','summary','flashcards','quiz'].includes(payload.kind)?payload.kind:'notice';
    const base={kind,heading:str(payload.heading,240),body:str(payload.body,12000)};
    if(['notice','need-context','search'].includes(kind)){base.matches=ids(payload.matches);return base;}
    if(kind==='explain'){base.termId=str(payload.termId,240);return base;}
    if(['compare','summary','flashcards'].includes(kind)){base.termIds=ids(payload.termIds);return base;}
    if(kind==='quiz'){
      base.questions=(Array.isArray(payload.questions)?payload.questions:[]).slice(0,30).map(q=>({
        question:str(q?.question,1000),
        choices:(Array.isArray(q?.choices)?q.choices:[]).slice(0,8).map(x=>str(x,1000)),
        correctIndex:Math.max(0,Math.min(7,Number(q?.correctIndex)||0)),
        explanation:str(q?.explanation,4000)
      }));
      return base;
    }
    return base;
  }
  function sanitizeChats(chats){
    if(!Array.isArray(chats))return [];
    return chats.slice(0,MAX_CHATS).map((c,i)=>({
      id:String(c?.id||`imported-${i}`).slice(0,120),
      title:String(c?.title||'Study chat').slice(0,120),
      messages:sanitizeMessages(c?.messages),
      contextIds:unique(Array.isArray(c?.contextIds)?c.contextIds:(Array.isArray(c?.context)?c.context:[])).slice(0,8),
      createdAt:String(c?.createdAt||c?.created_at||'').slice(0,64),
      updatedAt:String(c?.updatedAt||c?.updated_at||'').slice(0,64)
    }));
  }
  function preferences(){
    return {
      theme:['dark','light'].includes(localStorage.getItem('smd21_theme'))?localStorage.getItem('smd21_theme'):'dark',
      lang:(window.SMD21?.validLangs||['en','ps','prs','fa','ar','tr','zh']).includes(localStorage.getItem('smd21_lang'))?localStorage.getItem('smd21_lang'):'en',
      motion:['auto','reduce'].includes(localStorage.getItem('smd21_motion'))?localStorage.getItem('smd21_motion'):'auto',
      fontScale:Math.min(125,Math.max(90,Number(localStorage.getItem('smd21_font_scale')||100))),
      columns:[1,2,3].includes(Number(localStorage.getItem('smd21_cols')))?Number(localStorage.getItem('smd21_cols')):3
    };
  }
  async function currentVersion(){try{const r=await fetch('./version.json',{cache:'no-store'});if(r.ok)return (await r.json()).version||'21'}catch{}return '21';}
  async function buildBackup(){
    const k=keys();
    return {
      kind:KIND,
      schema_version:SCHEMA,
      app_version:await currentVersion(),
      created_at:new Date().toISOString(),
      source_account:accountEmail(),
      data:{
        selected:unique(arr(k.selected)),
        bookmarks:unique(arr(k.bookmarks)),
        history:unique(arr(k.history)),
        chats:sanitizeChats(arr(k.chats)),
        preferences:preferences()
      },
      exclusions:['cloud/session tokens','consent record','Supabase keys','other account profiles']
    };
  }
  function validateBackup(x){
    if(!x||x.kind!==KIND||x.schema_version!==SCHEMA||!x.data||typeof x.data!=='object')throw Error('This is not a supported Suhail Medical Dictionary account backup.');
    const d=x.data;
    ['selected','bookmarks','history','chats'].forEach(k=>{if(!Array.isArray(d[k]))throw Error(`Backup field “${k}” is invalid.`)});
    if(d.selected.length>MAX_LIST||d.bookmarks.length>MAX_LIST||d.history.length>MAX_LIST||d.chats.length>MAX_CHATS)throw Error('Backup exceeds safe item limits.');
    return {
      kind:KIND,schema_version:SCHEMA,app_version:String(x.app_version||''),created_at:String(x.created_at||''),source_account:String(x.source_account||'').toLowerCase(),
      data:{selected:unique(d.selected),bookmarks:unique(d.bookmarks),history:unique(d.history),chats:sanitizeChats(d.chats),preferences:sanitizePreferences(d.preferences)}
    };
  }
  function sanitizePreferences(p={}){return {
    theme:['dark','light'].includes(p.theme)?p.theme:'dark',
    lang:(window.SMD21?.validLangs||['en','ps','prs','fa','ar','tr','zh']).includes(p.lang)?p.lang:'en',
    motion:['auto','reduce'].includes(p.motion)?p.motion:'auto',
    fontScale:Math.min(125,Math.max(90,Number(p.fontScale)||100)),
    columns:[1,2,3].includes(Number(p.columns))?Number(p.columns):3
  }}
  function mergeChats(local,remote){
    const m=new Map();
    [...sanitizeChats(local),...sanitizeChats(remote)].forEach(c=>{
      const prev=m.get(c.id); if(!prev||String(c.updatedAt||'')>String(prev.updatedAt||''))m.set(c.id,c);
    });
    return [...m.values()].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).slice(0,MAX_CHATS);
  }
  function applyPreferences(p){
    p=sanitizePreferences(p);
    SMD21.setTheme(p.theme);SMD21.setLang(p.lang);SMD21.setMotion(p.motion);SMD21.setFontScale(p.fontScale);localStorage.setItem('smd21_cols',String(p.columns));
  }
  function restoreBackup(backup,mode='merge'){
    const b=validateBackup(backup),k=keys(),replace=mode==='replace';
    const cur={selected:arr(k.selected),bookmarks:arr(k.bookmarks),history:arr(k.history),chats:arr(k.chats)};
    const out=replace?b.data:{
      selected:unique([...cur.selected,...b.data.selected]),
      bookmarks:unique([...cur.bookmarks,...b.data.bookmarks]),
      history:unique([...b.data.history,...cur.history]).slice(0,MAX_LIST),
      chats:mergeChats(cur.chats,b.data.chats),
      preferences:b.data.preferences
    };
    localStorage.setItem(k.selected,JSON.stringify(out.selected));
    localStorage.setItem(k.bookmarks,JSON.stringify(out.bookmarks));
    localStorage.setItem(k.history,JSON.stringify(out.history));
    localStorage.setItem(k.chats,JSON.stringify(out.chats));
    applyPreferences(out.preferences);
    SMD21Auth.touchProfile();
    return {source:b.source_account,target:accountEmail(),mode,counts:{selected:out.selected.length,bookmarks:out.bookmarks.length,history:out.history.length,chats:out.chats.length}};
  }
  function downloadJSON(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500)}
  function safeFilenameEmail(){return accountEmail().replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'')||'local'}
  async function exportBackup(){const b=await buildBackup();downloadJSON(b,`suhail-medical-dictionary-backup-${safeFilenameEmail()}-${new Date().toISOString().slice(0,10)}.json`);return b}
  async function readFile(file){if(!file)throw Error('Choose a JSON backup file first.');if(file.size>MAX_FILE)throw Error('Backup file is larger than the 5 MB safety limit.');const text=await file.text();return validateBackup(JSON.parse(text))}
  function summary(b){return `${b.data.selected.length} selected · ${b.data.bookmarks.length} bookmarks · ${b.data.history.length} history · ${b.data.chats.length} AI chats`}
  function initUI(){
    const exportBtn=$('#exportAccountBackup'),file=$('#restoreBackupFile'),restore=$('#restoreAccountBackup'),mode=$('#restoreMode'),allow=$('#allowCrossAccountRestore'),status=$('#backupStatus'),preview=$('#backupPreview');
    if(!exportBtn||!file||!restore||!mode||!allow||!status||!preview)return;
    let parsed=null;
    const setStatus=(m,ok=false)=>{status.textContent=m;status.classList.toggle('ok',ok)};
    exportBtn.addEventListener('click',async()=>{try{const b=await exportBackup();setStatus(`Backup exported for ${b.source_account}.`,true)}catch(e){setStatus(e.message)}});
    file.addEventListener('change',async()=>{
      parsed=null;restore.disabled=true;allow.checked=false;$('#crossAccountRestoreRow').classList.add('hidden');
      try{parsed=await readFile(file.files?.[0]);const mismatch=!!parsed.source_account&&parsed.source_account!==accountEmail();preview.textContent=`Source: ${parsed.source_account||'unknown'} · ${summary(parsed)} · created ${parsed.created_at||'unknown date'}`;$('#crossAccountRestoreRow').classList.toggle('hidden',!mismatch);restore.disabled=mismatch;setStatus(mismatch?'This backup belongs to a different account. Check the confirmation box to restore it into the current account.':'Backup validated and ready to restore.',!mismatch)}catch(e){preview.textContent='No validated backup loaded.';setStatus(`Backup validation failed: ${e.message}`)}
    });
    allow.addEventListener('change',()=>{if(!parsed)return;const mismatch=parsed.source_account&&parsed.source_account!==accountEmail();restore.disabled=!!(mismatch&&!allow.checked)});
    restore.addEventListener('click',()=>{if(!parsed)return;try{const r=restoreBackup(parsed,mode.value);setStatus(`Restore complete (${r.mode}) for ${r.target}: ${Object.values(r.counts).reduce((a,b)=>a+b,0)} stored items. Reloading counts…`,true);document.dispatchEvent(new CustomEvent('smd21:backup-restored',{detail:r}));setTimeout(()=>location.reload(),550)}catch(e){setStatus(`Restore failed: ${e.message}`)}});
  }
  document.addEventListener('DOMContentLoaded',initUI);
  window.SMD21Backup={KIND,SCHEMA,MAX_FILE,buildBackup,validateBackup,restoreBackup,mergeChats,sanitizeChats,sanitizePreferences,readFile};
})();
