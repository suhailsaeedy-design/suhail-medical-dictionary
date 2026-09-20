import {currentSession,peekSession,signOut,getMyProfile,setOwnerReviewConsent,logEvent,hasPrivacyConsent,rememberPrivacyConsent} from './auth.js?v=20.18.2';
import {createChat,listChats,loadMessages,renameChat,deleteChat,editUserMessage,askAI,getAIServiceStatus} from './ai.js?v=20.18.2';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const LANG_LOCALE={en:'en-US',ps:'ps-AF',prs:'fa-AF',fa:'fa-IR',tr:'tr-TR',ar:'ar-SA',zh:'zh-CN'};
const MODE_LABEL={explain:'Explain mode',compare:'Compare mode',quiz:'Quiz mode',flashcards:'Flashcard mode',summary:'Summary mode'};
const MODE_PLACEHOLDER={
  explain:'Ask for a clear explanation of a medical concept…',
  compare:'Ask to compare two conditions, terms or mechanisms…',
  quiz:'Choose a topic and ask for recall questions…',
  flashcards:'Choose a topic and create study flashcards…',
  summary:'Ask for a concise high-yield study summary…'
};
const state={session:null,chatId:null,chats:[],context:[],lang:localStorage.getItem('smd-content-lang')||'en',mode:localStorage.getItem('smd-ai-mode')||'explain',liveVoice:false,recognition:null};
const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function init(){
  state.session=peekSession()||await currentSession().catch(()=>null);
  if(!state.session){location.replace('./index.html');return;}
  if(!hasPrivacyConsent(state.session)){const p=await getMyProfile().catch(()=>null);if(p?.privacy_ack_at)rememberPrivacyConsent(state.session,p.privacy_ack_at);else{location.replace('./index.html?consent=1&next=ai.html');return;}}
  const theme=localStorage.getItem('smd-theme')||'clinical';
  document.body.dataset.theme=theme;
  if($('#themeSelect'))$('#themeSelect').value=theme;
  if($('#contentLanguage'))$('#contentLanguage').value=state.lang;
  bindUI();updateAccount();loadPendingContext();setStudyMode(state.mode,false);
  await Promise.allSettled([loadProfile(),refreshChats(),checkBackend(),logEvent('ai_page_open',{build:'20.18.2'})]);
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
}

function bindUI(){
  $('#themeSelect')?.addEventListener('change',e=>{document.body.dataset.theme=e.target.value;localStorage.setItem('smd-theme',e.target.value);});
  $('#contentLanguage')?.addEventListener('change',e=>{state.lang=e.target.value;localStorage.setItem('smd-content-lang',state.lang);renderContext();});
  $('#accountButton')?.addEventListener('click',toggleAccountMenu);
  $('#switchAccountButton')?.addEventListener('click',switchAccount);
  $('#signOutButton')?.addEventListener('click',logout);
  document.addEventListener('click',e=>{if(!e.target.closest('.account-wrap'))closeAccountMenu();});

  $('#newChat')?.addEventListener('click',newChat);
  $('#renameChat')?.addEventListener('click',handleRename);
  $('#deleteChat')?.addEventListener('click',handleDelete);
  $('#clearContext')?.addEventListener('click',()=>{state.context=[];localStorage.removeItem('smd-ai-context');renderContext();});
  $('#chatForm')?.addEventListener('submit',sendMessage);
  $('#chatInput')?.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();$('#chatForm')?.requestSubmit();}});
  $('#micButton')?.addEventListener('click',voiceInput);
  $('#liveVoiceToggle')?.addEventListener('change',toggleLiveVoice);
  $('#reviewConsentToggle')?.addEventListener('change',changeConsent);
  $('#chatSearchInput')?.addEventListener('input',e=>renderChats(state.chats,e.target.value));

  $('#aiMobileChatsButton')?.addEventListener('click',openChatsDrawer);
  $('#aiMobileChatsClose')?.addEventListener('click',closeChatsDrawer);
  $('#aiMobileChatsBackdrop')?.addEventListener('click',closeChatsDrawer);

  $$('[data-study-mode]').forEach(btn=>btn.addEventListener('click',()=>setStudyMode(btn.dataset.studyMode)));
  $$('[data-ai-prompt]').forEach(btn=>btn.addEventListener('click',()=>prefillPrompt(btn.dataset.aiPrompt||'')));
  $$('[data-ai-example]').forEach(btn=>btn.addEventListener('click',()=>prefillPrompt(btn.dataset.aiExample||'')));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeAccountMenu();closeChatsDrawer();}});
}

function updateAccount(){
  const s=state.session,meta=s?.user?.user_metadata||{},fallback=s?.user?.email?.split('@')[0]||'Account',name=meta.full_name||meta.name||fallback;
  if($('#accountButton'))$('#accountButton').innerHTML=`<span class="avatar-dot">●</span><span class="account-lines"><b>${esc(name)}</b><small>Medical Learner</small></span><span class="account-chevron" aria-hidden="true">▾</span>`;
  if($('#accountMenuName'))$('#accountMenuName').textContent=name;
  if($('#accountMenuEmail'))$('#accountMenuEmail').textContent=s?.user?.email||'';
}
function toggleAccountMenu(e){e?.stopPropagation();const m=$('#accountMenu'),b=$('#accountButton');if(!m||!b)return;const open=m.classList.contains('hidden');m.classList.toggle('hidden',!open);b.setAttribute('aria-expanded',String(open));}
function closeAccountMenu(){$('#accountMenu')?.classList.add('hidden');$('#accountButton')?.setAttribute('aria-expanded','false');}
async function switchAccount(){closeAccountMenu();stopLiveVoice();await signOut();location.replace('./index.html?switch=1');}
async function logout(){closeAccountMenu();stopLiveVoice();await signOut();location.replace('./index.html');}

async function loadProfile(){
  const p=await getMyProfile();if(!p)return;
  $('#privacyAccountRow')?.classList.remove('hidden');
  if($('#reviewConsentToggle')){$('#reviewConsentToggle').checked=!!p.allow_owner_review;$('#reviewConsentToggle').disabled=!!p.local_only;}
  $('#adminLink')?.classList.toggle('hidden',!p.is_owner);
  $('#adminSidebarLink')?.classList.toggle('hidden',!p.is_owner);
  if($('#authHint'))$('#authHint').textContent=p.local_only?'Zero-Cost local account · chats stay on this device.':'Your chats are private to this signed-in account.';
  if(p.local_only&&$('#privacyAccountStatus'))$('#privacyAccountStatus').textContent='Local mode: owner chat review is disabled; chats stay on this device.';
}
async function changeConsent(e){try{const saved=await setOwnerReviewConsent(e.target.checked);e.target.checked=!!saved;if($('#privacyAccountStatus'))$('#privacyAccountStatus').textContent=saved?'Owner chat-review consent enabled.':'Owner chat-review consent disabled.';}catch(err){e.target.checked=!e.target.checked;if($('#privacyAccountStatus'))$('#privacyAccountStatus').textContent=err.message;}}

async function checkBackend(){
  const s=$('#aiBackendStatus');if(!s)return;
  const x=await getAIServiceStatus();
  const localMode=!x.online&&x.localAvailable;
  s.classList.toggle('offline',!x.online);
  const dot=s.querySelector('i');if(dot)dot.style.background=x.online?'#21bd6b':(localMode?'#5da9ff':'#e2a11b');
  const label=s.querySelector('span');if(label)label.textContent=x.online?'Optional Free Cloud AI':(localMode?'Offline Study Engine':'Study service unavailable');
  if($('#aiStatus'))$('#aiStatus').textContent=x.online?`${x.provider||'Cloudflare Workers AI'} · free-only · no paid fallback`:'Local study engine · no cloud cost';
  setTimeout(()=>{if($('#aiStatus')?.textContent.includes('no cloud cost')||$('#aiStatus')?.textContent.includes('no paid fallback'))$('#aiStatus').textContent='';},4200);
}

function loadPendingContext(){try{const raw=JSON.parse(localStorage.getItem('smd-ai-context')||'[]');state.context=Array.isArray(raw)?raw:[];}catch{state.context=[];}renderContext();}
function renderContext(){
  const box=$('#contextChips'),names=state.context.map(t=>t.localized_term?.[state.lang]||t.term).filter(Boolean);
  if($('#chatContextLabel'))$('#chatContextLabel').textContent=names.length?`Selected context: ${names.slice(0,5).join(', ')}${names.length>5?'…':''}`:'No dictionary terms selected as context.';
  if(box)box.innerHTML=names.slice(0,12).map(n=>`<span>${esc(n)}</span>`).join('')+(names.length>12?`<span>+${names.length-12} more</span>`:'');
}

function setStudyMode(mode,persist=true){
  if(!MODE_LABEL[mode])mode='explain';state.mode=mode;
  if(persist)localStorage.setItem('smd-ai-mode',mode);
  $$('[data-study-mode]').forEach(b=>b.classList.toggle('active',b.dataset.studyMode===mode));
  if($('#studyModeLabel'))$('#studyModeLabel').textContent=MODE_LABEL[mode];
  if($('#chatInput'))$('#chatInput').placeholder=MODE_PLACEHOLDER[mode];
}
function prefillPrompt(text){const input=$('#chatInput');if(!input)return;input.value=text;input.focus();input.scrollIntoView({behavior:'smooth',block:'center'});}

async function refreshChats(){
  try{
    state.chats=await listChats();renderChats(state.chats,$('#chatSearchInput')?.value||'');
    if(!state.chatId&&state.chats[0])await openChat(state.chats[0].id,state.chats[0].title,false);
    else if(!state.chats.length&&$('#authHint'))$('#authHint').textContent='No chats yet. Create a new private study chat.';
  }catch(err){if($('#authHint'))$('#authHint').textContent=err.message;}
}
function renderChats(chats,query=''){
  const list=$('#chatList');if(!list)return;
  const q=String(query||'').trim().toLowerCase();const rows=(chats||[]).filter(c=>!q||String(c.title||'').toLowerCase().includes(q));
  list.innerHTML='';
  for(const c of rows){const b=document.createElement('button');b.type='button';b.className='chat-list-item'+(state.chatId===c.id?' active':'');b.innerHTML=`<span>${esc(c.title||'Untitled chat')}</span><small>${c.updated_at?new Date(c.updated_at).toLocaleDateString():''}</small>`;b.addEventListener('click',()=>openChat(c.id,c.title,true));list.appendChild(b);}
  if(!rows.length&&q)list.innerHTML='<div class="v20-ai-auth-hint">No conversation matches this search.</div>';
}
async function newChat(){
  try{const c=await createChat(`Medical study ${new Date().toLocaleDateString()}`);state.chatId=c.id;await openChat(c.id,c.title,true);await refreshChatsNoLoop();$('#chatInput')?.focus();return true;}
  catch(err){alert(err.message);return false;}
}
async function openChat(id,title,closeDrawer=true){
  state.chatId=id;if($('#chatTitle'))$('#chatTitle').textContent=title||'Medical Study Assistant';
  try{renderMessages(await loadMessages(id));await refreshChatsNoLoop();if(closeDrawer)closeChatsDrawer();}
  catch(err){if($('#messageList'))$('#messageList').innerHTML=`<div class="assistant-note">${esc(err.message)}</div>`;}
}
async function refreshChatsNoLoop(){state.chats=await listChats();renderChats(state.chats,$('#chatSearchInput')?.value||'');}
function renderMessages(msgs){const list=$('#messageList');if(!list)return;list.innerHTML='<div class="assistant-note">Educational assistant: verify important medical facts with trusted references and instructors. Avoid entering unnecessary personal medical information.</div>';for(const m of msgs)appendMessage(m.role,m.content,m.id);list.scrollTop=list.scrollHeight;}
function appendMessage(role,content,id=null){
  const list=$('#messageList');if(!list)return;
  const d=document.createElement('div');d.className=`message ${role}`;d.innerHTML=`<div>${esc(content)}</div><div class="message-tools"><button data-copy type="button">Copy</button>${role==='user'&&id?'<button data-edit type="button">Edit</button>':''}</div>`;
  d.querySelector('[data-copy]')?.addEventListener('click',async()=>{try{await navigator.clipboard?.writeText(content);}catch{}});
  d.querySelector('[data-edit]')?.addEventListener('click',async()=>{const next=prompt('Edit your prompt:',content);if(next&&next!==content){try{await editUserMessage(id,next);await openChat(state.chatId,$('#chatTitle')?.textContent,false);}catch(err){alert(err.message);}}});
  list.appendChild(d);
}
async function handleRename(){if(!state.chatId)return alert('Open or create a chat first.');const name=prompt('New chat name:',$('#chatTitle')?.textContent||'');if(!name?.trim())return;try{await renameChat(state.chatId,name.trim());if($('#chatTitle'))$('#chatTitle').textContent=name.trim();await refreshChatsNoLoop();}catch(err){alert(err.message);}}
async function handleDelete(){if(!state.chatId)return alert('Open or create a chat first.');if(!confirm('Delete this chat and its messages?'))return;try{await deleteChat(state.chatId);state.chatId=null;if($('#chatTitle'))$('#chatTitle').textContent='Medical Study Assistant';if($('#messageList'))$('#messageList').innerHTML='<div class="assistant-note">Chat deleted. Create or open another study chat.</div>';await refreshChats();}catch(err){alert(err.message);}}

async function sendMessage(e){
  e?.preventDefault?.();const input=$('#chatInput'),text=input?.value.trim();if(!text)return;
  if(!state.chatId){const ok=await newChat();if(!ok||!state.chatId)return;}
  appendMessage('user',text);input.value='';if($('#aiStatus'))$('#aiStatus').textContent='Thinking…';
  try{
    const selectedTerms=state.context.map(t=>({term:t.term,definition:t.definition?.[state.lang]||t.definition?.en||'',explanation:t.explanation?.[state.lang]||t.explanation?.en||''}));
    const data=await askAI({chatId:state.chatId,message:text,selectedTerms,language:state.lang,mode:state.mode});
    appendMessage('assistant',data.answer||'No response returned.');
    if($('#speakReply')?.checked)await speakReply(data.answer||'',state.lang);
    await refreshChatsNoLoop();
  }catch(err){appendMessage('assistant',`Error: ${err.message}`);}
  finally{if($('#aiStatus'))$('#aiStatus').textContent='';const list=$('#messageList');if(list)list.scrollTop=list.scrollHeight;if(state.liveVoice)setTimeout(startLiveListening,450);}
}

function speakReply(text,lang){return new Promise(resolve=>{if(!('speechSynthesis'in window)||!text)return resolve();const u=new SpeechSynthesisUtterance(text.slice(0,3500));u.lang=LANG_LOCALE[lang]||'en-US';u.rate=.92;u.onend=resolve;u.onerror=resolve;speechSynthesis.cancel();speechSynthesis.speak(u);});}
function createRecognition(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;const r=new SR();r.lang=LANG_LOCALE[state.lang]||'en-US';r.interimResults=true;r.continuous=false;return r;}
function voiceInput(){const r=createRecognition();if(!r)return alert('Voice recognition is not available in this browser.');if($('#aiStatus'))$('#aiStatus').textContent='Listening…';r.onresult=e=>{if($('#chatInput'))$('#chatInput').value=[...e.results].map(x=>x[0].transcript).join(' ');};r.onerror=()=>{if($('#aiStatus'))$('#aiStatus').textContent='Voice input failed.';};r.onend=()=>setTimeout(()=>{if($('#aiStatus'))$('#aiStatus').textContent='';},500);r.start();}
function toggleLiveVoice(e){state.liveVoice=e.target.checked;if(state.liveVoice)startLiveListening();else stopLiveVoice();}
function startLiveListening(){if(!state.liveVoice)return;try{state.recognition?.abort?.();}catch{}const r=createRecognition();if(!r){state.liveVoice=false;if($('#liveVoiceToggle'))$('#liveVoiceToggle').checked=false;return alert('Live voice is not supported in this browser.');}state.recognition=r;let final='';r.onstart=()=>{if($('#aiStatus'))$('#aiStatus').textContent='Live voice · listening…';};r.onresult=e=>{final=[...e.results].map(x=>x[0].transcript).join(' ').trim();if($('#chatInput'))$('#chatInput').value=final;};r.onerror=()=>{if($('#aiStatus'))$('#aiStatus').textContent='Live voice paused.';};r.onend=()=>{if(final&&state.liveVoice)sendMessage(new Event('submit',{cancelable:true}));else if(state.liveVoice)setTimeout(startLiveListening,700);};try{r.start();}catch{}}
function stopLiveVoice(){state.liveVoice=false;if($('#liveVoiceToggle'))$('#liveVoiceToggle').checked=false;try{state.recognition?.abort?.();}catch{}state.recognition=null;}

function openChatsDrawer(){document.body.classList.add('v20-ai-chats-open');$('#aiMobileChatsButton')?.setAttribute('aria-expanded','true');$('#aiMobileChatsBackdrop')?.setAttribute('aria-hidden','false');}
function closeChatsDrawer(){document.body.classList.remove('v20-ai-chats-open');$('#aiMobileChatsButton')?.setAttribute('aria-expanded','false');$('#aiMobileChatsBackdrop')?.setAttribute('aria-hidden','true');}

window.addEventListener('offline',()=>{const label=$('#aiBackendStatus span');if(label)label.textContent='Offline Study Engine';if($('#aiStatus'))$('#aiStatus').textContent='Offline Study Engine ready · no cloud cost';});
window.addEventListener('online',checkBackend);
init().catch(err=>{console.error(err);document.body.innerHTML=`<main class="session-loader"><div class="session-error-card"><h2>AI workspace could not open</h2><p>${esc(err.message)}</p><a class="button primary" href="./app.html">Back to Dictionary</a></div></main>`;});
