import {CONFIG} from './config.js?v=13.0.0';
import {getSupabase,currentSession,peekSession} from './auth.js?v=13.0.0';

let workerConfigPromise=null;

async function requireSession(){
  const fresh=await currentSession().catch(()=>null);
  const sess=fresh||peekSession();
  if(!sess?.access_token||!sess?.user?.id){
    throw new Error('Your Google session has expired. Use the account menu and sign in again.');
  }
  return sess;
}

async function getWorkerUrl(){
  const direct=String(CONFIG.aiWorkerUrl||'').trim();
  if(direct)return direct.replace(/\/$/,'');
  if(!workerConfigPromise){
    workerConfigPromise=fetch('./ai-config.json',{cache:'no-store'})
      .then(async r=>r.ok?await r.json():{})
      .catch(()=>({}));
  }
  const cfg=await workerConfigPromise;
  return String(cfg?.workerUrl||'').trim().replace(/\/$/,'');
}

export async function getAIServiceStatus(){
  const url=await getWorkerUrl();
  if(!url)return {configured:false,online:false,message:'AI backend is not connected yet.'};
  if(!navigator.onLine)return {configured:true,online:false,message:'Offline'};
  try{
    const r=await fetch(`${url}/health`,{cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    return {configured:true,online:r.ok,workerUrl:url,model:data.model||'',message:r.ok?'AI service online':(data.error||`AI service error (${r.status})`)};
  }catch(err){
    return {configured:true,online:false,workerUrl:url,message:err?.message||'AI service unavailable'};
  }
}

export async function createChat(title='New medical chat'){
  const sess=await requireSession();
  const sb=await getSupabase();
  if(!sb)throw new Error('Cloud account storage is not configured.');
  const {data,error}=await sb.from('chats').insert({user_id:sess.user.id,title:String(title||'New medical chat').slice(0,120)}).select().single();
  if(error)throw error;
  return data;
}

export async function listChats(){
  const sess=await requireSession();
  const sb=await getSupabase();
  if(!sb)return[];
  const {data,error}=await sb.from('chats').select('*').eq('user_id',sess.user.id).order('updated_at',{ascending:false});
  if(error)throw error;
  return data||[];
}

export async function loadMessages(chatId){
  const sess=await requireSession();
  const sb=await getSupabase();
  if(!sb)return[];
  const {data,error}=await sb.from('ai_messages').select('*').eq('chat_id',chatId).eq('user_id',sess.user.id).order('created_at',{ascending:true});
  if(error)throw error;
  return data||[];
}

export async function renameChat(chatId,title){
  const sess=await requireSession();
  const sb=await getSupabase();
  if(!sb)throw new Error('Cloud account storage is unavailable.');
  const {error}=await sb.from('chats').update({title:String(title||'').slice(0,120),updated_at:new Date().toISOString()}).eq('id',chatId).eq('user_id',sess.user.id);
  if(error)throw error;
}

export async function deleteChat(chatId){
  const sess=await requireSession();
  const sb=await getSupabase();
  if(!sb)throw new Error('Cloud account storage is unavailable.');
  const {error}=await sb.from('chats').delete().eq('id',chatId).eq('user_id',sess.user.id);
  if(error)throw error;
}

export async function editUserMessage(messageId,content){
  const sess=await requireSession();
  const sb=await getSupabase();
  if(!sb)throw new Error('Cloud account storage is unavailable.');
  const {error}=await sb.from('ai_messages').update({content:String(content||'').slice(0,12000),edited_at:new Date().toISOString()}).eq('id',messageId).eq('user_id',sess.user.id).eq('role','user');
  if(error)throw error;
}

async function worker(path,body){
  const workerUrl=await getWorkerUrl();
  if(!workerUrl)throw new Error('AI backend is not connected yet. Finish the Cloudflare AI setup once; then AI chat and missing translations will work for everyone.');
  const sess=await requireSession();
  if(!navigator.onLine)throw new Error('AI needs an internet connection. The dictionary itself still works offline.');
  const r=await fetch(`${workerUrl}${path}`,{
    method:'POST',
    headers:{'content-type':'application/json','authorization':`Bearer ${sess.access_token}`},
    body:JSON.stringify(body)
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok){
    if(r.status===401)throw new Error('Your Google session expired. Sign in again and retry.');
    throw new Error(data.error||`AI request failed (${r.status}).`);
  }
  return data;
}

export async function askAI({chatId,message,selectedTerms=[],language='en'}){
  return worker('/chat',{chatId,message,selectedTerms,language});
}

export async function translateTerm({termId,term,definition,explanation,language}){
  return worker('/translate',{termId,term,definition,explanation,language});
}
