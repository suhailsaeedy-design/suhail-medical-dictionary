import './core.js?v=13.0.0';
import {getSupabase,currentSession,signOut,logEvent,getMyProfile,setOwnerReviewConsent} from './auth.js?v=13.0.0';

// Optional features are lazy-loaded only after the core dictionary is allowed to open.
// A PDF/AI/PWA module failure must never prevent the workspace from starting.
let aiModulePromise=null, exportModulePromise=null, pwaModulePromise=null;
const aiModule=()=>aiModulePromise||(aiModulePromise=import('./ai.js?v=13.0.0'));
const exportModule=()=>exportModulePromise||(exportModulePromise=import('./export.js?v=13.0.0'));
const pwaModule=()=>pwaModulePromise||(pwaModulePromise=import('./pwa.js?v=13.0.0'));
async function createChat(...a){return (await aiModule()).createChat(...a);} async function listChats(...a){return (await aiModule()).listChats(...a);} async function loadMessages(...a){return (await aiModule()).loadMessages(...a);} async function renameChat(...a){return (await aiModule()).renameChat(...a);} async function deleteChat(...a){return (await aiModule()).deleteChat(...a);} async function editUserMessage(...a){return (await aiModule()).editUserMessage(...a);} async function askAI(...a){return (await aiModule()).askAI(...a);} async function translateTerm(...a){return (await aiModule()).translateTerm(...a);}
function printTerms(...a){exportModule().then(m=>m.printTerms(...a)).catch(()=>alert('Print tools could not start. Reload once and retry.'));}
async function pdfTerms(...a){try{return await (await exportModule()).pdfTerms(...a);}catch{return alert('PDF tools could not start. Use Print → Save as PDF.');}}
async function zipCategoryPdfs(...a){try{return await (await exportModule()).zipCategoryPdfs(...a);}catch{return alert('ZIP/PDF tools could not start. Retry while online.');}}
async function initPWA(...a){try{return await (await pwaModule()).initPWA(...a);}catch{return null;}}

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const RTL=new Set(['ps','prs','fa','ar']);
const LOCALE={en:'en-US',ps:'ps-AF',prs:'fa-AF',fa:'fa-IR',tr:'tr-TR',ar:'ar-SA',zh:'zh-CN'};
const state={index:null,categories:[],filtered:[],selected:new Map(),active:null,lang:localStorage.getItem('smd-content-lang')||'en',category:'all',query:'',chatId:null,chatContext:[],selectedMode:false,liveVoice:false,recognition:null};
const categoryCache=new Map();

function sessionFailure(message){
 const loader=document.querySelector('#sessionLoader');
 if(!loader)return;
 loader.innerHTML=`<div class="session-error-card"><h2>Could not open your workspace</h2><p>${esc(message||'Your sign-in session could not be checked.')}</p><div class="session-error-actions"><button id="sessionRetry" class="button primary">Retry</button><a class="button ghost" href="./index.html">Back to sign in</a></div></div>`;
 document.querySelector('#sessionRetry')?.addEventListener('click',()=>location.reload());
}
async function init(){
 let requiredSession=null;
 try{requiredSession=await currentSession({waitMs:6500,allowStorageFallback:true});}
 catch(err){sessionFailure(err.message||'Session check timed out.');return;}
 if(!requiredSession){location.replace('./index.html');return;}
 document.body.classList.remove('auth-pending');document.body.classList.add('auth-ready');
 const loader=document.querySelector('#sessionLoader');if(loader)loader.remove();
 document.body.dataset.theme=localStorage.getItem('smd-theme')||'clinical';
 $('#contentLanguage').value=state.lang;setDir();
 $('#contentLanguage').addEventListener('change',()=>{state.lang=$('#contentLanguage').value;localStorage.setItem('smd-content-lang',state.lang);setDir();renderTerms();if(state.active)showDetail(state.active);});
 $('#themeSelect').value=document.body.dataset.theme;$('#themeSelect').addEventListener('change',e=>{document.body.dataset.theme=e.target.value;localStorage.setItem('smd-theme',e.target.value);});
 const res=await fetch('./data/index.json',{cache:'no-cache'});if(!res.ok)throw new Error(`Dictionary index failed (${res.status})`);state.index=await res.json();state.categories=state.index.categories||[];populateCategories();filter();bindUI();
 initAuth(requiredSession).catch(err=>{$('#authHint').textContent=err.message||'Cloud account features will retry when available.';});
 registerInstall();initPWA({categories:state.categories}).catch(()=>{});
 const draft=localStorage.getItem('smd-chat-draft');if(draft&&$('#chatInput')){$('#chatInput').value=draft;localStorage.removeItem('smd-chat-draft');}
}
function setDir(){document.documentElement.lang=state.lang;document.documentElement.dir=RTL.has(state.lang)?'rtl':'ltr';}
function populateCategories(){const s=$('#categorySelect');for(const c of state.categories){const o=document.createElement('option');o.value=c.id;o.textContent=`${c.label} (${Number(c.count||0).toLocaleString()})`;s.appendChild(o);}}
function bindUI(){
 $('#searchInput').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();state.selectedMode=false;filter();});
 $('#categorySelect').addEventListener('change',e=>{state.category=e.target.value;state.selectedMode=false;filter();});
 $('#selectedButton').addEventListener('click',()=>{state.selectedMode=!state.selectedMode;renderTerms();$('#selectedButton').classList.toggle('active',state.selectedMode);});
 $('#printSelected').addEventListener('click',()=>printTerms('Selected medical terms',[...state.selected.values()],state.lang));
 $('#pdfSelected').addEventListener('click',()=>pdfTerms('Selected medical terms',[...state.selected.values()],state.lang));
 $('#pdfCategory').addEventListener('click',async()=>{if(state.category==='all')return alert('Select one category first. Use the ZIP button for all categories.');const cat=state.category,c=state.categories.find(x=>x.id===cat);if(!c)return;await pdfTerms(c.label,await loadCategory(cat),state.lang,`${safeName(c.label)}.pdf`);});
 $('#pdfAllZip').addEventListener('click',()=>zipCategoryPdfs(state.categories,loadCategory,state.lang));
 $('#aiSelectedButton').addEventListener('click',()=>{state.chatContext=[...state.selected.values()].slice(0,40);updateChatContext();$('#ai').scrollIntoView({behavior:'smooth'});});
 $('#accountButton').addEventListener('click',handleAccountButton);
 $('#newChat').addEventListener('click',newChat);$('#renameChat').addEventListener('click',handleRenameChat);$('#deleteChat').addEventListener('click',handleDeleteChat);$('#chatForm').addEventListener('submit',sendMessage);$('#micButton').addEventListener('click',voiceInput);$('#liveVoiceToggle').addEventListener('change',toggleLiveVoice);$('#clearContext').addEventListener('click',()=>{state.chatContext=[];updateChatContext();});
 $('#reviewConsentToggle').addEventListener('change',handleConsentChange);
 $('#chatInput').addEventListener('input',e=>localStorage.setItem('smd-chat-draft',e.target.value));
}
function filter(){const src=state.index?.terms||[];state.filtered=src.filter(t=>(state.category==='all'||t.category===state.category)&&(!state.query||(`${t.term} ${(t.synonyms||[]).join(' ')}`).toLowerCase().includes(state.query)));renderTerms();}
function renderTerms(){
 const grid=$('#termGrid');grid.innerHTML='';const base=state.selectedMode?[...state.selected.values()].map(x=>({id:x.id,term:x.term,category:x.category,category_label:x.category_label,synonyms:x.synonyms||[]})):state.filtered;const arr=base.slice(0,320);
 for(const item of arr){const card=document.createElement('article');card.className='term-card'+(state.active?.id===item.id?' active':'');const checked=state.selected.has(item.id);card.innerHTML=`<input type="checkbox" ${checked?'checked':''} aria-label="Select ${esc(item.term)}"><div class="term-main"><div class="term-name">${esc(item.term)}</div><div class="term-meta"><span class="tag">${esc(item.category_label||categoryLabel(item.category))}</span>${item.synonyms?.length?`<span>${item.synonyms.length} synonym${item.synonyms.length>1?'s':''}</span>`:''}</div></div>`;
  card.addEventListener('click',async e=>{if(e.target.tagName==='INPUT')return;const full=await getTerm(item);state.active=full;showDetail(full);$$('.term-card').forEach(x=>x.classList.remove('active'));card.classList.add('active');});
  const cb=card.querySelector('input');cb.addEventListener('change',async()=>{const full=await getTerm(item);cb.checked?state.selected.set(item.id,full):state.selected.delete(item.id);updateSelectedCount();if(state.selectedMode)renderTerms();});grid.appendChild(card);
 }
 const total=base.length,fullCount=Number(state.index?.term_count||state.index?.terms?.length||total),searchable=Number(state.index?.searchable_name_count||fullCount);$('#resultSummary').textContent=state.selectedMode?`${total.toLocaleString()} selected terms`:`${total.toLocaleString()} matching terms · ${fullCount.toLocaleString()} official MeSH concepts · ${searchable.toLocaleString()} searchable names`;if(!total)grid.innerHTML='<div class="empty-state">No matching terms.</div>';
}
async function loadCategory(id){
 if(categoryCache.has(id))return categoryCache.get(id);const c=state.categories.find(x=>x.id===id);if(!c)return[];const files=(c.files||[c.file]).filter(Boolean);const all=[];
 for(const file of files){const r=await fetch(`./data/categories/${file}`);if(!r.ok)throw new Error(`Could not load ${c.label} data.`);const part=await r.json();all.push(...part);}
 categoryCache.set(id,all);return all;
}
async function getTerm(item){const arr=await loadCategory(item.category);return arr.find(x=>x.id===item.id)||item;}
const LANG_TEXT={
 en:{meaning:'Meaning / Definition',explanation:'Explanation',synonyms:'Synonyms / related terms',tools:'Study tools',loading:'Loading translation…',status:'Translation is being prepared and will be cached for later/offline use.'},
 ps:{meaning:'معنا / تعریف',explanation:'تشریح',synonyms:'مترادف او اړوند نومونه',tools:'د مطالعې وسایل',loading:'پښتو ژباړه چمتو کېږي…',status:'معنا او تشریح پښتو ته اړول کېږي او بیا به په وسیله کې هم وساتل شي.'},
 prs:{meaning:'معنا / تعریف',explanation:'تشریح',synonyms:'مترادف‌ها و اصطلاحات مرتبط',tools:'ابزار مطالعه',loading:'ترجمهٔ دری آماده می‌شود…',status:'معنا و تشریح به دری ترجمه و برای استفادهٔ بعدی ذخیره می‌شود.'},
 fa:{meaning:'معنا / تعریف',explanation:'توضیح',synonyms:'مترادف‌ها و اصطلاحات مرتبط',tools:'ابزار مطالعه',loading:'ترجمهٔ فارسی آماده می‌شود…',status:'معنا و توضیح ترجمه و برای استفادهٔ بعدی ذخیره می‌شود.'},
 tr:{meaning:'Anlam / Tanım',explanation:'Açıklama',synonyms:'Eş anlamlı / ilgili terimler',tools:'Çalışma araçları',loading:'Türkçe çeviri hazırlanıyor…',status:'Tanım ve açıklama çevriliyor ve daha sonra kullanılmak üzere önbelleğe alınıyor.'},
 ar:{meaning:'المعنى / التعريف',explanation:'الشرح',synonyms:'مرادفات ومصطلحات ذات صلة',tools:'أدوات الدراسة',loading:'جارٍ إعداد الترجمة العربية…',status:'يتم ترجمة المعنى والشرح وحفظهما للاستخدام لاحقاً.'},
 zh:{meaning:'含义 / 定义',explanation:'说明',synonyms:'同义词 / 相关术语',tools:'学习工具',loading:'正在生成中文翻译…',status:'定义和说明正在翻译并缓存以供以后使用。'}
};
function displayTerm(t,lang=state.lang){return t.localized_term?.[lang]||t.term;}
function showDetail(t){
 const l=state.lang,txt=LANG_TEXT[l]||LANG_TEXT.en,has=!!t.definition?.[l];
 const translatedName=displayTerm(t,l),def=has?t.definition[l]:(l==='en'?(t.definition?.en||'Definition not available.'):txt.loading),exp=has?(t.explanation?.[l]||''):(l==='en'?(t.explanation?.en||''):txt.loading);
 const originalLine=l!=='en'&&translatedName!==t.term?`<div class="original-term">English: ${esc(t.term)}</div>`:'';
 $('#detailPanel').innerHTML=`<div class="detail-head"><div><span class="tag">${esc(t.category_label||categoryLabel(t.category))}</span><h2 id="detailTermName">${esc(translatedName)}</h2>${originalLine}</div><button class="pronounce" id="pronounceTerm" title="Pronounce English medical term">🔊</button></div><div class="detail-section"><h3>${esc(txt.meaning)}</h3><p id="detailDefinition">${esc(def)}</p></div><div class="detail-section"><h3>${esc(txt.explanation)}</h3><p id="detailExplanation">${esc(exp)}</p>${!has&&l!=='en'?`<p id="translationStatus" class="microcopy">${esc(txt.status)}</p>`:''}</div>${t.synonyms?.length?`<div class="detail-section"><h3>${esc(txt.synonyms)}</h3><div class="synonyms">${t.synonyms.map(s=>`<span>${esc(s)}</span>`).join('')}</div></div>`:''}<div class="detail-section"><h3>${esc(txt.tools)}</h3><button class="button secondary full" id="detailSelect">${state.selected.has(t.id)?'Remove from selected':'Add to selected'}</button><button class="button ghost full" style="margin-top:8px" id="detailAI">Ask AI about this term</button></div><div class="detail-section"><p class="microcopy">Source: ${esc(t.source||state.index?.source_note||'Suhail Medical Dictionary')}</p></div>`;
 $('#detailPanel').classList.add('open');$('#pronounceTerm').onclick=()=>pronounce(t.term);$('#detailSelect').onclick=()=>{state.selected.has(t.id)?state.selected.delete(t.id):state.selected.set(t.id,t);updateSelectedCount();showDetail(t);renderTerms();};$('#detailAI').onclick=()=>{state.chatContext=[t];updateChatContext();$('#ai').scrollIntoView({behavior:'smooth'});};if(!has&&l!=='en')loadMissingTranslation(t,l);
}
async function loadMissingTranslation(t,lang){const status=$('#translationStatus');try{const local=await getLocalTranslation(t.id,lang);if(local){applyTranslation(t,lang,local);if(status)status.textContent='Saved translation available offline on this device.';return;}const sb=await getSupabase();if(sb&&navigator.onLine){const {data}=await sb.from('term_translation_cache').select('term_name,definition,explanation,reviewed').eq('term_id',t.id).eq('language',lang).maybeSingle();if(data?.definition){applyTranslation(t,lang,data);await saveLocalTranslation(t.id,lang,data);if(status)status.textContent=data.reviewed?'Reviewed shared translation.':'Shared AI-assisted translation · medical review recommended.';return;}}const sess=await currentSession();if(!sess){if(status)status.textContent=navigator.onLine?'Sign in to generate this missing translation once and share the cached result.':'No saved translation on this device. Connect once to load it.';return;}if(!navigator.onLine){if(status)status.textContent='No saved translation on this device. Translation generation needs internet.';return;}if(status)status.textContent=(LANG_TEXT[lang]||LANG_TEXT.en).loading;const x=await translateTerm({termId:t.id,term:t.term,definition:t.definition?.en||'',explanation:t.explanation?.en||'',language:lang});applyTranslation(t,lang,x);await saveLocalTranslation(t.id,lang,x);if(status)status.textContent=x.reviewed?'Reviewed translation.':(x.cached?'Cached AI-assisted translation · medical review recommended.':'AI-assisted translation · saved for offline use on this device.');}catch(err){if(status)status.textContent=`Translation unavailable: ${err.message}`;}}
function applyTranslation(t,lang,x){t.definition=t.definition||{};t.explanation=t.explanation||{};t.localized_term=t.localized_term||{};t.definition[lang]=x.definition||'';t.explanation[lang]=x.explanation||'';t.localized_term[lang]=x.term_name||x.term||t.term;if(state.active?.id===t.id&&state.lang===lang){const name=$('#detailTermName');if(name)name.textContent=displayTerm(t,lang);$('#detailDefinition').textContent=x.definition||'';$('#detailExplanation').textContent=x.explanation||'';}}
function pronounce(text){if(!('speechSynthesis'in window))return alert('Speech synthesis is not available in this browser.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.82;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>/^en(-|_)/i.test(v.lang))||null;speechSynthesis.speak(u);}
function updateSelectedCount(){$('#selectedCount').textContent=state.selected.size;}function categoryLabel(id){return state.categories.find(c=>c.id===id)?.label||id;}

async function initAuth(sess=null){if(!sess)sess=await currentSession();updateAccount(sess);if(sess){await logEvent('app_open');await loadPrivacyProfile();await refreshChats();}else setCloudState();}
function setCloudState(){if(!navigator.onLine)$('#authHint').textContent='Offline mode: dictionary available; cloud login and AI will reconnect when internet returns.';}
function updateAccount(sess){$('#accountButton').textContent=sess?`${sess.user.email.split('@')[0]} · Sign out`:'Sign in';$('#authHint').textContent=sess?'Your account has separate private chat history. Owner review requires your explicit consent.':'Sign in with Google to save separate chat history.';$('#privacyAccountRow').classList.toggle('hidden',!sess);}
async function loadPrivacyProfile(){const p=await getMyProfile();if(!p)return;$('#reviewConsentToggle').checked=!!p.allow_owner_review;$('#adminLink').classList.toggle('hidden',!p.is_owner);}
async function handleConsentChange(e){try{await setOwnerReviewConsent(e.target.checked);$('#privacyAccountStatus').textContent=e.target.checked?'Owner chat-review consent enabled.':'Owner chat-review consent disabled.';}catch(err){e.target.checked=!e.target.checked;$('#privacyAccountStatus').textContent=err.message;}}
async function handleAccountButton(){const sess=await currentSession();if(sess){if(confirm('Sign out of your account?')){stopLiveVoice();await signOut();location.replace('./index.html');}return;}location.replace('./index.html');}
async function refreshChats(){try{const chats=await listChats();renderChats(chats);if(!state.chatId&&chats[0])await openChat(chats[0].id,chats[0].title);}catch(err){$('#authHint').textContent=err.message;}}
function renderChats(chats){const list=$('#chatList');list.innerHTML='';for(const c of chats){const b=document.createElement('button');b.className='chat-list-item'+(state.chatId===c.id?' active':'');b.textContent=c.title;b.onclick=()=>openChat(c.id,c.title);list.appendChild(b);}}
async function newChat(){try{const c=await createChat(`Medical chat ${new Date().toLocaleDateString()}`);state.chatId=c.id;await refreshChats();await openChat(c.id,c.title);}catch(err){alert(err.message);}}
async function openChat(id,title){state.chatId=id;$('#chatTitle').textContent=title;const msgs=await loadMessages(id);renderMessages(msgs);await refreshChatsNoLoop();}
async function refreshChatsNoLoop(){const chats=await listChats();renderChats(chats);}
function renderMessages(msgs){const list=$('#messageList');list.innerHTML='<div class="assistant-note">Educational assistant: verify important medical facts with trusted references and instructors. Do not enter unnecessary personal medical information.</div>';for(const m of msgs)appendMessage(m.role,m.content,m.id);list.scrollTop=list.scrollHeight;}
function appendMessage(role,content,id=null){const d=document.createElement('div');d.className=`message ${role}`;d.innerHTML=`<div>${esc(content)}</div><div class="message-tools"><button data-copy>Copy</button>${role==='user'&&id?'<button data-edit>Edit</button>':''}</div>`;d.querySelector('[data-copy]').onclick=()=>navigator.clipboard?.writeText(content);const e=d.querySelector('[data-edit]');if(e)e.onclick=async()=>{const next=prompt('Edit your prompt:',content);if(next&&next!==content){try{await editUserMessage(id,next);await openChat(state.chatId,$('#chatTitle').textContent);}catch(err){alert(err.message);}}};$('#messageList').appendChild(d);}
async function handleRenameChat(){if(!state.chatId)return;const name=prompt('New chat name:',$('#chatTitle').textContent);if(!name)return;try{await renameChat(state.chatId,name.trim().slice(0,120));$('#chatTitle').textContent=name.trim();await refreshChatsNoLoop();}catch(err){alert(err.message);}}
async function handleDeleteChat(){if(!state.chatId||!confirm('Delete this chat and its messages?'))return;try{await deleteChat(state.chatId);state.chatId=null;$('#messageList').innerHTML='<div class="assistant-note">Chat deleted.</div>';$('#chatTitle').textContent='Medical Study Assistant';await refreshChats();}catch(err){alert(err.message);}}
function updateChatContext(){const names=state.chatContext.map(t=>t.term);$('#chatContextLabel').textContent=names.length?`Selected context: ${names.slice(0,5).join(', ')}${names.length>5?'…':''}`:'';}
async function sendMessage(e){
 e?.preventDefault?.();const text=$('#chatInput').value.trim();if(!text)return;const sess=await currentSession();if(!sess){stopLiveVoice();location.replace('./index.html');return;}if(!navigator.onLine){appendMessage('assistant','AI is offline right now. Your downloaded medical dictionary is still available.');stopLiveVoice();return;}if(!state.chatId)await newChat();appendMessage('user',text);$('#chatInput').value='';localStorage.removeItem('smd-chat-draft');$('#aiStatus').textContent='Thinking…';
 try{const selectedTerms=state.chatContext.map(t=>({term:t.term,definition:t.definition?.[state.lang]||t.definition?.en||'',explanation:t.explanation?.[state.lang]||t.explanation?.en||''}));const data=await askAI({chatId:state.chatId,message:text,selectedTerms,language:state.lang});appendMessage('assistant',data.answer);if($('#speakReply').checked)await speakReply(data.answer,state.lang);await refreshChatsNoLoop();}
 catch(err){appendMessage('assistant',`Error: ${err.message}`);}finally{$('#aiStatus').textContent='';$('#messageList').scrollTop=$('#messageList').scrollHeight;if(state.liveVoice)setTimeout(startLiveListening,450);}
}
function speakReply(text,lang){return new Promise(resolve=>{if(!('speechSynthesis'in window))return resolve();const u=new SpeechSynthesisUtterance(text.slice(0,3500));u.lang=LOCALE[lang]||'en-US';u.rate=.92;u.onend=resolve;u.onerror=resolve;speechSynthesis.cancel();speechSynthesis.speak(u);});}
function createRecognition(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;const r=new SR();r.lang=LOCALE[state.lang]||'en-US';r.interimResults=true;r.continuous=false;return r;}
function voiceInput(){const r=createRecognition();if(!r)return alert('Voice recognition is not available in this browser. You can still type your question.');$('#aiStatus').textContent='Listening…';r.onresult=e=>{$('#chatInput').value=[...e.results].map(x=>x[0].transcript).join(' ');};r.onerror=()=>$('#aiStatus').textContent='Voice input failed.';r.onend=()=>setTimeout(()=>$('#aiStatus').textContent='',300);r.start();}
function toggleLiveVoice(e){state.liveVoice=e.target.checked;if(state.liveVoice)startLiveListening();else stopLiveVoice();}
function startLiveListening(){if(!state.liveVoice||!navigator.onLine)return;try{state.recognition?.abort?.();}catch{}const r=createRecognition();if(!r){state.liveVoice=false;$('#liveVoiceToggle').checked=false;return alert('Live voice is not supported in this browser.');}state.recognition=r;let final='';r.onstart=()=>$('#aiStatus').textContent='Live voice · listening…';r.onresult=e=>{final=[...e.results].map(x=>x[0].transcript).join(' ').trim();$('#chatInput').value=final;};r.onerror=()=>{$('#aiStatus').textContent='Live voice paused.';};r.onend=()=>{if(final&&state.liveVoice)sendMessage(new Event('submit'));else if(state.liveVoice)setTimeout(startLiveListening,700);};try{r.start();}catch{}}
function stopLiveVoice(){state.liveVoice=false;if($('#liveVoiceToggle'))$('#liveVoiceToggle').checked=false;try{state.recognition?.abort?.();}catch{}state.recognition=null;}
function registerInstall(){let deferred=null;const b=$('#installButton');if(/iPhone|iPad/i.test(navigator.userAgent))b.classList.remove('hidden');window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;b.classList.remove('hidden');});b.onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;b.classList.add('hidden');}else if(/iPhone|iPad/i.test(navigator.userAgent))alert('On iPhone/iPad: Share → Add to Home Screen to install this web app.');else alert('Use your browser menu and choose Install app / Add to home screen if available.');};}
function openTranslationDb(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return resolve(null);const r=indexedDB.open('suhail-medical-dictionary',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('translations'))r.result.createObjectStore('translations',{keyPath:'key'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function getLocalTranslation(termId,lang){try{const db=await openTranslationDb();if(!db)return null;return await new Promise((resolve,reject)=>{const tx=db.transaction('translations','readonly'),r=tx.objectStore('translations').get(`${termId}:${lang}`);r.onsuccess=()=>resolve(r.result?.value||null);r.onerror=()=>reject(r.error);});}catch{return null;}}
async function saveLocalTranslation(termId,lang,value){try{const db=await openTranslationDb();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction('translations','readwrite');tx.objectStore('translations').put({key:`${termId}:${lang}`,value:{term_name:value.term_name||value.term||'',definition:value.definition||'',explanation:value.explanation||'',reviewed:!!value.reviewed},savedAt:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch{}}
function safeName(s){return String(s).replace(/[^a-z0-9-_]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'category';}function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
window.addEventListener('online',()=>{if(state.liveVoice)startLiveListening();});window.addEventListener('offline',()=>{stopLiveVoice();$('#aiStatus').textContent='Offline · dictionary remains available';});
init().catch(err=>{console.error(err);$('#termGrid').innerHTML=`<div class="empty-state">Could not load dictionary data: ${esc(err.message)}</div>`;});
