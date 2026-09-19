const MODEL='@cf/zai-org/glm-4.7-flash';
const PROVIDER='Cloudflare Workers AI';
const FREE_ALLOCATION_NEURONS_PER_DAY=10000;
const FREE_ONLY=true;
const LANG={en:'English',ps:'Pashto',prs:'Dari (Afghanistan)',fa:'Persian',tr:'Turkish',ar:'Arabic',zh:'Simplified Chinese'};
export default {async fetch(request,env){
 const url=new URL(request.url),cors=corsHeaders(request,env);
 if(request.method==='OPTIONS')return new Response(null,{headers:cors});
 if(!originAllowed(request,env))return json({error:'Origin not allowed'},403,cors);
 if(request.method==='GET'&&url.pathname==='/health'){const missing=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'].filter(k=>!env[k]);return json({ok:missing.length===0,provider:PROVIDER,model:MODEL,freeOnly:FREE_ONLY,requiresModelApiKey:false,freeAllocationNeuronsPerDay:FREE_ALLOCATION_NEURONS_PER_DAY,database:'Supabase PostgreSQL',missing},missing.length?503:200,cors);}
 if(request.method!=='POST'||!['/chat','/translate'].includes(url.pathname))return json({error:'Not found'},404,cors);
 try{
  if(!env.AI)return json({error:'Workers AI binding is missing'},503,cors);
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!token)return json({error:'Authentication required'},401,cors);
  const user=await validateUser(token,env);if(!user?.id)return json({error:'Invalid login session'},401,cors);
  const body=await request.json();
  if(url.pathname==='/translate')return handleTranslate(body,user,env,cors);
  return handleChat(body,user,env,cors);
 }catch(e){return json({error:e?.message||'AI service error'},Number(e?.status)||500,cors);}
}};
async function handleChat(body,user,env,cors){
 const allowed=await consumeQuota(env,user.id,'chat',Number(env.AI_DAILY_USER_LIMIT||30));if(!allowed)return json({error:'Your free AI study limit for today has been reached. The dictionary remains available.'},429,cors);
 const chatId=String(body.chatId||''),message=String(body.message||'').trim().slice(0,12000),selected=Array.isArray(body.selectedTerms)?body.selectedTerms.slice(0,40):[],language=LANG[body.language]||'English';
 if(!chatId||!message)return json({error:'chatId and message are required'},400,cors);
 const chat=await sb(env,`/rest/v1/chats?id=eq.${encodeURIComponent(chatId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id`,{method:'GET'});if(!chat?.[0])return json({error:'Chat not found'},404,cors);
 await insertMessage(env,{chat_id:chatId,user_id:user.id,role:'user',content:message,selected_terms:selected});
 const history=await sb(env,`/rest/v1/ai_messages?chat_id=eq.${encodeURIComponent(chatId)}&select=role,content&order=created_at.desc&limit=18`,{method:'GET'});
 const recent=(history||[]).reverse().filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.content}));
 const context=selected.length?`\nSelected dictionary context:\n${selected.map((t,i)=>`${i+1}. ${t.term}: ${t.definition||''} ${t.explanation||''}`).join('\n').slice(0,14000)}`:'';
 const system=`You are the Suhail Medical Dictionary study assistant for medical students. Answer in ${language} unless the user asks for another language. Explain terminology accurately, clearly, and at an educational level. Use selected dictionary context when relevant. Separate definitions, mechanisms, and examples. Do not invent references. State uncertainty when needed. Do not provide a diagnosis or individualized treatment plan. For personal symptom questions, provide only general educational information and encourage appropriate professional care. Never reveal another user's data or imply that you can access it. If asked who created this project, state that Suhail Saeedy is the creator and developer of Suhail Medical Dictionary. Owner/admin audit is handled outside the model and only under the site's consent rules.${context}`;
 const out=await runFreeAI(env,{messages:[{role:'system',content:system},...recent.slice(-14)],max_completion_tokens:700,temperature:.25,user:user.id});const answer=extractText(out);if(!answer)throw new Error('AI returned an empty response.');
 await insertMessage(env,{chat_id:chatId,user_id:user.id,role:'assistant',content:answer,selected_terms:selected});await sb(env,`/rest/v1/chats?id=eq.${encodeURIComponent(chatId)}`,{method:'PATCH',body:JSON.stringify({updated_at:new Date().toISOString()}),headers:{Prefer:'return=minimal'}});
 return json({answer,model:MODEL},200,cors);
}
async function handleTranslate(body,user,env,cors){
 const termId=String(body.termId||'').slice(0,120),term=String(body.term||'').slice(0,500),sourceDefinition=String(body.definition||'').slice(0,8000),sourceExplanation=String(body.explanation||'').slice(0,8000),langCode=String(body.language||''),language=LANG[langCode];
 if(!termId||!term||!sourceDefinition||!language||langCode==='en')return json({error:'Valid term and target language are required'},400,cors);
 const cached=await sb(env,`/rest/v1/term_translation_cache?term_id=eq.${encodeURIComponent(termId)}&language=eq.${encodeURIComponent(langCode)}&select=term_name,definition,explanation,reviewed&limit=1`,{method:'GET'});if(cached?.[0])return json({...cached[0],cached:true},200,cors);
 const allowed=await consumeQuota(env,user.id,'translation',Number(env.TRANSLATION_DAILY_USER_LIMIT||30));if(!allowed)return json({error:'Your free translation-generation limit for today has been reached.'},429,cors);
 const system=`Translate the supplied medical dictionary content from English into ${language} for medical students. Return ONLY valid JSON with exactly these string keys: term_name, definition, explanation. For term_name: use the standard target-language medical equivalent when one exists. If the term is primarily a proper name, eponym, acronym, Latin/scientific name, drug name, brand name, or has no established semantic translation, do not invent a meaning; instead use a faithful target-script transliteration where appropriate. In Pashto specifically, if there is no natural Pashto equivalent, write the English medical name in Pashto script rather than replacing it with an invented definition. Translate the definition and explanation fully and naturally. Preserve medical meaning, abbreviations, units, and clinically important distinctions. Do not add diagnosis or treatment advice.`;
 const prompt=`TERM: ${term}\nDEFINITION: ${sourceDefinition}\nEXPLANATION: ${sourceExplanation}`;const out=await runFreeAI(env,{messages:[{role:'system',content:system},{role:'user',content:prompt}],max_completion_tokens:700,temperature:.05,user:user.id});const raw=extractText(out);let parsed;try{parsed=JSON.parse(raw.replace(/^```json\s*/i,'').replace(/```$/,'').trim());}catch{throw new Error('AI returned an invalid translation format.');}
 const term_name=String(parsed.term_name||term).trim().slice(0,1000),definition=String(parsed.definition||'').trim().slice(0,10000),explanation=String(parsed.explanation||'').trim().slice(0,10000);if(!definition)throw new Error('AI returned an empty translation.');
 const row={term_id:termId,language:langCode,term_name,definition,explanation,model:MODEL,reviewed:false,updated_at:new Date().toISOString()};await sb(env,'/rest/v1/term_translation_cache?on_conflict=term_id,language',{method:'POST',body:JSON.stringify(row),headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});return json({term_name,definition,explanation,cached:false,reviewed:false},200,cors);
}

async function runFreeAI(env,input){
 try{return await env.AI.run(MODEL,input);}
 catch(e){
  const msg=String(e?.message||e||'');
  if(/quota|limit|neurons|429|3040|capacity/i.test(msg)){
    const err=new Error('The free AI allowance is temporarily exhausted. No paid fallback is enabled; try again after the free quota resets.');
    err.status=429;throw err;
  }
  if(/403|paid|upgrade|billing/i.test(msg)){
    const err=new Error('This deployment is locked to free-only AI. The selected free model is unavailable right now; no paid model will be used.');
    err.status=503;throw err;
  }
  throw e;
 }
}

function extractText(out){if(typeof out==='string')return out.trim();if(typeof out?.response==='string')return out.response.trim();if(typeof out?.result?.response==='string')return out.result.response.trim();const c=out?.choices?.[0]?.message?.content;if(typeof c==='string')return c.trim();if(Array.isArray(c))return c.map(x=>x?.text||x?.content||'').join('').trim();return '';}
async function consumeQuota(env,userId,kind,limit){const r=await sb(env,'/rest/v1/rpc/consume_ai_quota',{method:'POST',body:JSON.stringify({p_user:userId,p_kind:kind,p_limit:limit})});return r===true||r?.[0]===true;}
async function validateUser(token,env){const r=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`}});if(!r.ok)return null;return r.json();}
async function insertMessage(env,row){return sb(env,'/rest/v1/ai_messages',{method:'POST',body:JSON.stringify(row),headers:{Prefer:'return=minimal'}});}
async function sb(env,path,opt={}){const r=await fetch(`${env.SUPABASE_URL}${path}`,{...opt,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',...(opt.headers||{})}});if(!r.ok){const t=await r.text();throw new Error(`Database error ${r.status}: ${t.slice(0,300)}`);}if(r.status===204)return null;const txt=await r.text();return txt?JSON.parse(txt):null;}
function originAllowed(req,env){const origin=req.headers.get('Origin');if(!origin)return true;const allowed=String(env.ALLOWED_ORIGINS||env.ALLOWED_ORIGIN||'*').split(',').map(x=>x.trim()).filter(Boolean);return allowed.includes('*')||allowed.includes(origin);}
function corsHeaders(req,env){const origin=req.headers.get('Origin')||'*';const ok=originAllowed(req,env);return {'Access-Control-Allow-Origin':ok?origin:'null','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Vary':'Origin'};}
function json(obj,status,headers){return new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8',...headers}});}
