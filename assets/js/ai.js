import {CONFIG} from './config.js?v=20.18.1';
import {getSupabase,currentSession,peekSession} from './auth.js?v=20.18.1';

let workerConfigPromise=null;
let localReferencePromise=null;
const CHAT_PREFIX='smd-local-chat-v1:';

async function requireSession(){
  const fresh=await currentSession().catch(()=>null);
  const sess=fresh||peekSession();
  if(!sess?.user?.id)throw new Error('Your local account session is unavailable. Return to Sign in and choose an email.');
  return sess;
}
async function getWorkerUrl(){
  const direct=String(CONFIG.aiWorkerUrl||'').trim();if(direct)return direct.replace(/\/$/,'');
  if(!workerConfigPromise)workerConfigPromise=fetch('./ai-config.json',{cache:'no-store'}).then(async r=>r.ok?await r.json():{}).catch(()=>({}));
  const cfg=await workerConfigPromise;return String(cfg?.workerUrl||'').trim().replace(/\/$/,'');
}
function localKey(userId){return CHAT_PREFIX+String(userId||'local');}
function readLocalStore(userId){
  try{const x=JSON.parse(localStorage.getItem(localKey(userId))||'null');if(x&&Array.isArray(x.chats)&&Array.isArray(x.messages))return x;}catch{}
  return {chats:[],messages:[]};
}
function writeLocalStore(userId,store){localStorage.setItem(localKey(userId),JSON.stringify(store));return store;}
function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;}
async function cloudStorage(){
  const sess=await requireSession();if(sess.local_only)return {sess,sb:null};
  const sb=await getSupabase().catch(()=>null);return {sess,sb};
}

export async function getAIServiceStatus(){
  const url=await getWorkerUrl();
  if(!url)return {configured:false,online:false,localAvailable:true,mode:'local',provider:'Suhail Offline Study Engine',freeOnly:true,message:'Local study engine ready; optional cloud AI is not configured.'};
  if(!navigator.onLine)return {configured:true,online:false,localAvailable:true,mode:'local',provider:'Suhail Offline Study Engine',freeOnly:true,message:'Offline study engine ready.'};
  try{
    const r=await fetch(`${url}/health`,{cache:'no-store'});const data=await r.json().catch(()=>({}));
    return {configured:true,online:r.ok,localAvailable:true,mode:r.ok?'cloud':'local',workerUrl:url,provider:r.ok?(data.provider||'Cloudflare Workers AI'):'Suhail Offline Study Engine',model:data.model||'',freeOnly:data.freeOnly!==false,freeAllocationNeuronsPerDay:Number(data.freeAllocationNeuronsPerDay||10000),requiresModelApiKey:!!data.requiresModelApiKey,database:data.database||'Optional Supabase PostgreSQL',message:r.ok?'Optional free cloud AI online':'Cloud AI unavailable; local study engine ready.'};
  }catch{return {configured:true,online:false,localAvailable:true,mode:'local',provider:'Suhail Offline Study Engine',freeOnly:true,message:'Cloud AI unavailable; local study engine ready.'};}
}

export async function createChat(title='New medical chat'){
  const {sess,sb}=await cloudStorage();
  if(sb){const {data,error}=await sb.from('chats').insert({user_id:sess.user.id,title:String(title||'New medical chat').slice(0,120)}).select().single();if(!error&&data)return data;}
  const s=readLocalStore(sess.user.id),now=new Date().toISOString(),chat={id:uid('chat'),user_id:sess.user.id,title:String(title||'New medical chat').slice(0,120),created_at:now,updated_at:now,local_only:true};s.chats.unshift(chat);writeLocalStore(sess.user.id,s);return chat;
}
export async function listChats(){
  const {sess,sb}=await cloudStorage();
  if(sb){const {data,error}=await sb.from('chats').select('*').eq('user_id',sess.user.id).order('updated_at',{ascending:false});if(!error)return data||[];}
  return readLocalStore(sess.user.id).chats.slice().sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
}
export async function loadMessages(chatId){
  const {sess,sb}=await cloudStorage();
  if(sb){const {data,error}=await sb.from('ai_messages').select('*').eq('chat_id',chatId).eq('user_id',sess.user.id).order('created_at',{ascending:true});if(!error)return data||[];}
  return readLocalStore(sess.user.id).messages.filter(m=>m.chat_id===chatId).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
}
export async function renameChat(chatId,title){
  const {sess,sb}=await cloudStorage();const clean=String(title||'').slice(0,120),now=new Date().toISOString();
  if(sb){const {error}=await sb.from('chats').update({title:clean,updated_at:now}).eq('id',chatId).eq('user_id',sess.user.id);if(!error)return;}
  const s=readLocalStore(sess.user.id),c=s.chats.find(x=>x.id===chatId);if(c){c.title=clean;c.updated_at=now;writeLocalStore(sess.user.id,s);}
}
export async function deleteChat(chatId){
  const {sess,sb}=await cloudStorage();if(sb){const {error}=await sb.from('chats').delete().eq('id',chatId).eq('user_id',sess.user.id);if(!error)return;}
  const s=readLocalStore(sess.user.id);s.chats=s.chats.filter(x=>x.id!==chatId);s.messages=s.messages.filter(x=>x.chat_id!==chatId);writeLocalStore(sess.user.id,s);
}
export async function editUserMessage(messageId,content){
  const {sess,sb}=await cloudStorage();const clean=String(content||'').slice(0,12000),now=new Date().toISOString();
  if(sb){const {error}=await sb.from('ai_messages').update({content:clean,edited_at:now}).eq('id',messageId).eq('user_id',sess.user.id).eq('role','user');if(!error)return;}
  const s=readLocalStore(sess.user.id),m=s.messages.find(x=>x.id===messageId&&x.role==='user');if(m){m.content=clean;m.edited_at=now;writeLocalStore(sess.user.id,s);}
}
async function appendLocalMessage(sess,chatId,role,content){
  const s=readLocalStore(sess.user.id),now=new Date().toISOString(),m={id:uid('msg'),chat_id:chatId,user_id:sess.user.id,role,content:String(content||'').slice(0,12000),created_at:now,local_only:true};s.messages.push(m);const c=s.chats.find(x=>x.id===chatId);if(c)c.updated_at=now;writeLocalStore(sess.user.id,s);return m;
}

async function loadLocalReferences(){
  if(localReferencePromise)return localReferencePromise;
  localReferencePromise=(async()=>{
    const idx=await fetch('./data/index.json',{cache:'force-cache'}).then(r=>r.json());
    const categoryFiles=(idx.categories||[]).map(c=>c.file).filter(Boolean);
    const termLists=await Promise.all(categoryFiles.map(f=>fetch(`./data/categories/${f}`,{cache:'force-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[])));
    const [conditions,procedures,pharmacology]=await Promise.all(['diseases','procedures','pharmacology'].map(n=>fetch(`./data/reference/${n}.json`,{cache:'force-cache'}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]}))));
    const terms=termLists.flat();
    return {terms,conditions:conditions.items||[],procedures:procedures.items||[],pharmacology:pharmacology.items||[]};
  })();return localReferencePromise;
}
function norm(v){return String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,' ');}
function score(text,item){
  const q=norm(text).split(/\s+/).filter(x=>x.length>2),hay=norm([item.term,item.name,item.category_label,item.specialty,item.group,...(item.synonyms||[]),...(item.aliases||[])].join(' '));
  let n=0;for(const w of q)if(hay.includes(w))n++;return n;
}
function bestItems(message,data,selectedTerms=[]){
  const selected=(selectedTerms||[]).map(x=>({term:x.term,name:x.term,definition:{en:x.definition||''},explanation:{en:x.explanation||''},selected:true}));
  const pool=[...data.terms,...data.conditions,...data.procedures,...data.pharmacology];
  const ranked=pool.map(x=>({x,s:score(message,x)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,5).map(x=>x.x);
  const seen=new Set(),out=[];for(const x of [...selected,...ranked]){const k=norm(x.term||x.name);if(k&&!seen.has(k)){seen.add(k);out.push(x);}}return out.slice(0,6);
}
function nameOf(x){return x.term||x.name||'Medical concept';}
function definitionOf(x){return x.definition?.en||x.summary||x.explanation?.en||'A bundled educational reference entry.';}
function explanationOf(x){return x.explanation?.en||x.summary||x.definition?.en||'';}
function localAnswer({message,selectedTerms=[],mode='explain'}){
  return loadLocalReferences().then(data=>{
    const hits=bestItems(message,data,selectedTerms);
    if(!hits.length)return 'Offline Study Engine: I could not match that question to the bundled dictionary or clinical-reference data. Try a specific term such as hypertension, asthma, femur, ECG, or bioavailability. This local engine does not invent missing medical facts.';
    if(mode==='compare'){
      const a=hits[0],b=hits[1];if(!b)return `Offline Study Engine — ${nameOf(a)}\n\n${definitionOf(a)}\n\nChoose or mention a second bundled term to compare.`;
      return `Offline Study Engine — Compare\n\n${nameOf(a)}: ${definitionOf(a)}\n\n${nameOf(b)}: ${definitionOf(b)}\n\nKey distinction: these are separate reference concepts; review their definitions and related anatomy/clinical context in the Dictionary for a source-bounded comparison.`;
    }
    if(mode==='quiz')return `Offline Study Engine — Quiz\n\n${hits.slice(0,4).map((x,i)=>`${i+1}. In your own words, what is ${nameOf(x)}?\n   Recall cue: ${definitionOf(x).split(/[.!?]/)[0]}.`).join('\n\n')}\n\nAnswers can be checked against the bundled Dictionary/Clinical Reference.`;
    if(mode==='flashcards')return `Offline Study Engine — Flashcards\n\n${hits.slice(0,5).map(x=>`• ${nameOf(x)} — ${definitionOf(x)}`).join('\n\n')}`;
    if(mode==='summary')return `Offline Study Engine — Summary\n\n${hits.slice(0,4).map(x=>`• ${nameOf(x)}: ${definitionOf(x)}`).join('\n')}\n\nThis summary is assembled only from bundled project data and contains no individualized diagnosis or treatment guidance.`;
    const x=hits[0];return `Offline Study Engine — ${nameOf(x)}\n\nDefinition: ${definitionOf(x)}\n\nStudy note: ${explanationOf(x)}\n\nThis answer comes from bundled local reference data. It is for learning, not diagnosis or treatment.`;
  });
}

async function remoteWorker(path,body){
  const workerUrl=await getWorkerUrl();if(!workerUrl)throw Object.assign(new Error('Optional cloud AI is not configured.'),{code:'NO_WORKER'});
  const sess=await requireSession();if(sess.local_only)throw Object.assign(new Error('Local account mode uses the offline study engine.'),{code:'LOCAL_ACCOUNT'});
  if(!navigator.onLine)throw Object.assign(new Error('Offline.'),{code:'OFFLINE'});
  const r=await fetch(`${workerUrl}${path}`,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${sess.access_token}`},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(data.error||`AI request failed (${r.status}).`);e.status=r.status;throw e;}return data;
}
export async function askAI({chatId,message,selectedTerms=[],language='en',mode='explain'}){
  const sess=await requireSession();
  if(chatId)await appendLocalMessage(sess,chatId,'user',message).catch(()=>{});
  let data=null;
  if(navigator.onLine&&!sess.local_only){try{data=await remoteWorker('/chat',{chatId,message,selectedTerms,language,mode});}catch{/* zero-cost local fallback below */}}
  if(!data){data={answer:await localAnswer({message,selectedTerms,mode}),provider:'Suhail Offline Study Engine',local:true,freeOnly:true};}
  if(chatId)await appendLocalMessage(sess,chatId,'assistant',data.answer||'').catch(()=>{});
  return data;
}
export async function translateTerm({termId,term,definition,explanation,language}){
  if(language==='en')return {term_name:term,term,definition,explanation,reviewed:false,cached:false,local:true};
  const sess=await requireSession();if(navigator.onLine&&!sess.local_only){try{return await remoteWorker('/translate',{termId,term,definition,explanation,language});}catch{}}
  throw new Error('This language is not bundled for this term. Zero-Cost Mode will not invent a translation; optional free cloud translation may be configured separately.');
}
