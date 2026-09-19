import {getSupabase,currentSession,signOut,getMyProfile,logEvent,getLocalEvents,getSavedLocalProfile} from './auth.js?v=20.16.0';
import {getAIServiceStatus} from './ai.js?v=20.16.0';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const CHAT_PREFIX='smd-local-chat-v1:';
let users=[];
let localMode=false;

async function init(){
  const theme=localStorage.getItem('smd-theme')||'dark';
  document.body.dataset.theme=theme;if($('#themeSelect'))$('#themeSelect').value=theme;
  bindShell();updateNetwork();await loadLocalContentHealth();
  const sess=await currentSession();
  if(!sess){location.replace('./index.html');return;}
  const me=await getMyProfile();
  if(!me?.is_owner){showGate('Access denied','This page is restricted to the configured owner account.');return;}
  localMode=!!sess.local_only;
  $('#adminGate')?.classList.add('hidden');$('#adminContent')?.classList.remove('hidden');
  if(localMode){
    setText('adminDbStatus','Local device storage');
    $('#adminDbStatus')?.nextElementSibling && ($('#adminDbStatus').nextElementSibling.textContent='No cloud database required');
    setText('auditUser','Zero-Cost local mode keeps chats private on this device. Cross-user chat audit is disabled because there is no shared cloud database.');
    const sel=$('#auditChatSelect');if(sel){sel.innerHTML='<option value="">Local privacy mode</option>';sel.disabled=true;}
    if($('#auditMessages'))$('#auditMessages').innerHTML='<div class="v20-admin-empty"><i class="bi bi-device-ssd"></i><span>Local-only mode: chat data stays on this device and is not exposed through an owner audit interface.</span></div>';
    await Promise.allSettled([loadLocalAdmin(sess),loadAiHealth(null,true),logEvent('admin_page_open',{build:'20.16.0',mode:'local-free'})]);
  }else{
    const sb=await getSupabase();
    if(!sb){showGate('Admin unavailable','Cloud account connection is not configured. Use a local Zero-Cost account or configure the optional free cloud service.');return;}
    await Promise.allSettled([loadAll(sb),logEvent('admin_page_open',{build:'20.16.0',mode:'optional-cloud'})]);
  }
}

function bindShell(){
  $('#themeSelect')?.addEventListener('change',e=>{document.body.dataset.theme=e.target.value;localStorage.setItem('smd-theme',e.target.value);});
  $('#adminSignOut')?.addEventListener('click',async()=>{await signOut();location.href='./index.html';});
  $('#refreshAdmin')?.addEventListener('click',async()=>{
    const sess=await currentSession();
    if(sess?.local_only)await loadLocalAdmin(sess);else{const sb=await getSupabase();if(sb)await loadAll(sb);}
    await loadLocalContentHealth();
  });
  $('#userFilter')?.addEventListener('input',renderUsers);
  $$('[data-admin-target]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.adminTarget;$$('[data-admin-target]').forEach(x=>x.classList.toggle('active',x===b));document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});}));
  addEventListener('online',updateNetwork);addEventListener('offline',updateNetwork);
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
}
function updateNetwork(){const s=$('#adminNetwork');if(!s)return;const online=navigator.onLine;s.classList.toggle('offline',!online);const dot=s.querySelector('i');if(dot)dot.style.background=online?'#21bd6b':'#e2a11b';const label=s.querySelector('span');if(label)label.textContent=online?'Online':'Offline';}
function showGate(title,message){if($('#adminGate'))$('#adminGate').innerHTML=`<div class="v20-admin-gate-icon"><i class="bi bi-shield-x"></i></div><div><span class="section-kicker">OWNER ACCESS</span><h1>${esc(title)}</h1><p>${esc(message)}</p><p style="margin-top:10px"><a class="v20-admin-secondary" href="./app.html">Back to Dictionary</a></p></div>`;}
function showError(message){const box=$('#adminError');if(!box)return;box.textContent=message;box.classList.toggle('hidden',!message);}
async function rpc(sb,name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw error;return data;}
function readLocalChatStore(userId){try{const x=JSON.parse(localStorage.getItem(CHAT_PREFIX+userId)||'null');if(x&&Array.isArray(x.chats)&&Array.isArray(x.messages))return x;}catch{}return {chats:[],messages:[]};}

async function loadLocalAdmin(sess){
  showError('');
  const refresh=$('#refreshAdmin');if(refresh){refresh.disabled=true;refresh.innerHTML='<i class="bi bi-arrow-repeat"></i> Refreshing…';}
  try{
    const profile=getSavedLocalProfile()||{};
    const store=readLocalChatStore(sess.user.id);
    const events=getLocalEvents();
    users=[{id:sess.user.id,email:sess.user.email,created_at:profile.created_at||null,last_seen_at:new Date().toISOString(),chat_count:store.chats.length,message_count:store.messages.length,allow_owner_review:false,local_only:true}];
    setText('metricUsers','1');setText('metricChats',store.chats.length.toLocaleString());setText('metricMessages',store.messages.length.toLocaleString());setText('metricEvents',events.length.toLocaleString());
    renderUsers();renderEvents(events);await loadAiHealth(null,true);setText('adminLastRefresh',new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));
  }catch(err){showError(err.message||'Local admin data could not be loaded.');}
  finally{if(refresh){refresh.disabled=false;refresh.innerHTML='<i class="bi bi-arrow-clockwise"></i> Refresh data';}}
}

async function loadAll(sb){
  showError('');
  const refresh=$('#refreshAdmin');if(refresh){refresh.disabled=true;refresh.innerHTML='<i class="bi bi-arrow-repeat"></i> Refreshing…';}
  try{
    const [stats,u,e]=await Promise.all([rpc(sb,'admin_dashboard_stats'),rpc(sb,'admin_user_summaries'),rpc(sb,'admin_recent_events',{p_limit:100})]);
    const s=Array.isArray(stats)?stats[0]:stats||{};users=Array.isArray(u)?u:[];
    setText('metricUsers',Number(s.total_users||0).toLocaleString());setText('metricChats',Number(s.total_chats||0).toLocaleString());setText('metricMessages',Number(s.total_messages||0).toLocaleString());setText('metricEvents',Number(s.total_events||0).toLocaleString());
    renderUsers();renderEvents(Array.isArray(e)?e:[]);await loadAiHealth(sb,false);setText('adminLastRefresh',new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));
  }catch(err){showError(err.message||'Admin data could not be loaded.');}
  finally{if(refresh){refresh.disabled=false;refresh.innerHTML='<i class="bi bi-arrow-clockwise"></i> Refresh data';}}
}

async function loadLocalContentHealth(){
  try{const idx=await fetch('./data/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Dictionary index unavailable')));setText('metricTerms',Number(idx.term_count||idx.terms?.length||0).toLocaleString());}catch{setText('metricTerms','—');}
  try{
    const names=['diseases','pharmacology','procedures'];const rows=await Promise.all(names.map(n=>fetch(`./data/reference/${n}.json`,{cache:'no-store'}).then(r=>r.ok?r.json():{})));
    const total=rows.reduce((sum,d)=>sum+(Array.isArray(d.items)?d.items.length:0),0);setText('metricReference',Number(total).toLocaleString());
  }catch{setText('metricReference','—');}
  setText('adminPwaStatus','serviceWorker' in navigator?'Supported':'Not supported');
}

async function loadAiHealth(sb,localOnly=false){
  const ai=await getAIServiceStatus().catch(()=>({configured:false,online:false,localAvailable:true,mode:'local'}));
  const local=localOnly||ai.mode==='local';
  setText('adminAiMode',local?'Zero-Cost · Local Study Engine':'Optional Free Cloud AI');
  setText('adminAiModel',local?'Bundled Dictionary + Clinical Reference':`${ai.provider||'Optional cloud AI'}${ai.model?' · '+ai.model:''}`);
  setText('adminAiWorker',ai.online?'Optional cloud connected':'Not required');
  if(localOnly){setText('adminAiChatToday','local');setText('adminAiTranslateToday','—');setText('adminAiUsersToday','1');}
  else if(sb){
    try{const usage=await rpc(sb,'admin_ai_usage_today');const row=Array.isArray(usage)?usage[0]:usage||{};setText('adminAiChatToday',Number(row.chat_requests||0).toLocaleString());setText('adminAiTranslateToday',Number(row.translation_requests||0).toLocaleString());setText('adminAiUsersToday',Number(row.ai_users||0).toLocaleString());}
    catch{setText('adminAiChatToday','migration');setText('adminAiTranslateToday','needed');setText('adminAiUsersToday','—');}
  }
  const b=$('#adminTestAi');if(b)b.onclick=async()=>{b.disabled=true;b.innerHTML='<i class="bi bi-arrow-repeat"></i> Checking…';const x=await getAIServiceStatus();b.innerHTML=x.online?'<i class="bi bi-check-circle"></i> Optional cloud connected':'<i class="bi bi-check-circle"></i> Local engine ready';setTimeout(()=>{b.disabled=false;b.innerHTML='<i class="bi bi-wifi"></i> Check study engine';},1800);};
}

function renderUsers(){
  const q=String($('#userFilter')?.value||'').trim().toLowerCase(),tbody=$('#userRows');if(!tbody)return;
  const rows=users.filter(u=>!q||String(u.email||'').toLowerCase().includes(q));
  tbody.innerHTML=rows.map(u=>`<tr><td>${esc(u.email||'—')}${u.local_only?' <small>· local</small>':''}</td><td>${fmt(u.created_at)}</td><td>${fmt(u.last_seen_at)}</td><td>${Number(u.chat_count||0).toLocaleString()}</td><td>${Number(u.message_count||0).toLocaleString()}</td><td><span class="v20-admin-consent ${u.allow_owner_review?'':'off'}">${u.allow_owner_review?'Enabled':'Private'}</span></td><td><button class="v20-admin-view" data-user="${esc(u.id||'')}" data-email="${esc(u.email||'')}" ${u.allow_owner_review&&!u.local_only?'':'disabled'}>${u.local_only?'Local only':(u.allow_owner_review?'View chats':'No consent')}</button></td></tr>`).join('')||'<tr><td colspan="7">No users match this filter.</td></tr>';
  $$('[data-user]:not([disabled])',tbody).forEach(b=>b.onclick=()=>loadUserChats(b.dataset.user,b.dataset.email));
}
function renderEvents(events){const list=$('#eventList');if(!list)return;list.innerHTML=events.map(e=>`<div class="v20-admin-event"><strong>${esc(e.event_type||'event')}</strong><small>${fmt(e.created_at)} · ${e.user_id?'user '+esc(String(e.user_id).slice(0,12)):'local device'}</small></div>`).join('')||'<p class="muted">No events yet.</p>';}
async function loadUserChats(userId,email){
  if(localMode)return;
  const sb=await getSupabase();if(!sb)return;
  setText('auditUser',`${email||'Selected user'} · review consent is currently enabled.`);
  try{const data=await rpc(sb,'admin_user_chats',{p_user:userId});const sel=$('#auditChatSelect');if(!sel)return;const chats=Array.isArray(data)?data:[];sel.innerHTML='<option value="">Choose chat</option>'+chats.map(c=>`<option value="${esc(c.id)}">${esc(c.title||'Untitled chat')}</option>`).join('');sel.onchange=()=>loadAuditMessages(sel.value);if(chats[0]){sel.value=chats[0].id;await loadAuditMessages(chats[0].id);}else if($('#auditMessages'))$('#auditMessages').innerHTML='<div class="v20-admin-empty"><i class="bi bi-chat-square"></i><span>No reviewable chats found.</span></div>';document.getElementById('audit')?.scrollIntoView({behavior:'smooth',block:'start'});}
  catch(err){showError(err.message);}
}
async function loadAuditMessages(chatId){
  const box=$('#auditMessages');if(!box)return;if(!chatId){box.innerHTML='<div class="v20-admin-empty"><i class="bi bi-shield-lock"></i><span>No chat selected.</span></div>';return;}
  if(localMode)return;
  const sb=await getSupabase();if(!sb)return;
  try{const data=await rpc(sb,'admin_chat_messages',{p_chat:chatId});const rows=Array.isArray(data)?data:[];box.innerHTML=rows.map(m=>`<div class="v20-admin-audit-message"><strong>${esc(m.role||'message')} · ${fmt(m.created_at)}</strong><div>${esc(m.content||'')}</div></div>`).join('')||'<div class="v20-admin-empty"><i class="bi bi-shield-check"></i><span>No messages are available, or consent has been withdrawn.</span></div>';}
  catch(err){box.textContent=err.message;}
}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
function fmt(d){return d?new Date(d).toLocaleString():'—';}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

init().catch(err=>showGate('Admin error',err.message||'The Admin Panel could not open.'));
