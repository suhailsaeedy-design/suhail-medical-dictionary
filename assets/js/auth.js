import {CONFIG} from './config.js?v=20.17.1';

// v4 uses Supabase Auth + PostgREST directly. No remote JavaScript SDK is required,
// so the workspace cannot be blocked by an SDK CDN or Web Locks/session-init deadlock.
const AUTH_STORAGE_KEY='smd-auth-v5';
const OLD_STORAGE_KEYS=['smd-auth-v4','smd-auth-v3-3'];
const DEFAULT_TIMEOUT=8000;
const LOCAL_PROFILE_KEY='smd-local-profile-v1';
const LOCAL_EVENTS_KEY='smd-local-events-v1';

function withTimeout(promise,ms=DEFAULT_TIMEOUT,label='Request'){
  let timer;
  return Promise.race([
    promise,
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out. Please retry.`)),ms);})
  ]).finally(()=>clearTimeout(timer));
}
function apiBase(){return String(CONFIG.supabaseUrl||'').replace(/\/$/,'');}
function configured(){return /^https:\/\//.test(apiBase())&&String(CONFIG.supabaseAnonKey||'').length>10;}
export function cloudConfigured(){return configured();}
function localProfile(){try{return JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY)||'null');}catch{return null;}}
export function getSavedLocalProfile(){const p=localProfile();return p?.email?{...p}:null;}
function saveLocalProfile(profile){localStorage.setItem(LOCAL_PROFILE_KEY,JSON.stringify(profile));return profile;}
function localSessionFromProfile(profile){if(!profile?.email)return null;return {access_token:`local-free:${profile.id}`,refresh_token:'',token_type:'local',expires_at:4102444800,local_only:true,user:{id:profile.id,email:profile.email,role:'authenticated',app_metadata:{provider:'local'},user_metadata:{name:profile.name||profile.email.split('@')[0],full_name:profile.name||profile.email.split('@')[0]}}};}
function localId(email){let h=2166136261;for(const ch of String(email).toLowerCase()){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return `local-${(h>>>0).toString(16)}`;}
export async function signInLocal(email){const clean=String(email||'').trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean))throw new Error('Enter a valid email address.');const old=localProfile();const p=saveLocalProfile({id:localId(clean),email:clean,name:clean.split('@')[0],created_at:old?.email===clean?old.created_at:new Date().toISOString(),privacy_ack_at:old?.email===clean?old.privacy_ack_at:null,allow_owner_review:false,is_owner:false,mode:'local-free'});const sess=localSessionFromProfile(p);saveSession(sess);return sess;}
export function getLocalEvents(){try{return JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY)||'[]');}catch{return[];}}
function jsonParse(raw){try{return JSON.parse(raw);}catch{return null;}}
function readStoredSession(){
  try{
    const direct=jsonParse(localStorage.getItem(AUTH_STORAGE_KEY));
    if(direct?.access_token&&direct?.user)return direct;
  }catch{}
  return null;
}
function saveSession(session){
  if(!session?.access_token||!session?.user)throw new Error('The sign-in response was incomplete.');
  localStorage.setItem(AUTH_STORAGE_KEY,JSON.stringify(session));
  for(const key of OLD_STORAGE_KEYS){try{localStorage.removeItem(key);}catch{}}
  return session;
}
function clearLocalAuth(){
  try{localStorage.removeItem(AUTH_STORAGE_KEY);}catch{}
  for(const key of OLD_STORAGE_KEYS){try{localStorage.removeItem(key);}catch{}}
  try{sessionStorage.removeItem('smd-oauth-inflight');}catch{}
}
function decodeJwtUser(token){
  try{
    const part=token.split('.')[1];
    const normalized=part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=');
    const payload=JSON.parse(decodeURIComponent(Array.from(atob(normalized),c=>`%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join('')));
    if(!payload?.sub)return null;
    return {id:payload.sub,email:payload.email||'',aud:payload.aud,role:payload.role||'authenticated',app_metadata:payload.app_metadata||{},user_metadata:payload.user_metadata||{}};
  }catch{return null;}
}
function authHeaders(token,extra={}){
  const h={'apikey':CONFIG.supabaseAnonKey,...extra};
  if(token)h.Authorization=`Bearer ${token}`;
  return h;
}
async function parseResponse(res){
  const text=await res.text();
  const body=text?jsonParse(text):null;
  if(!res.ok){
    const err=new Error(body?.msg||body?.message||body?.error_description||body?.error||`Request failed (${res.status}).`);
    err.status=res.status;err.code=body?.code||body?.error_code||'';err.details=body?.details||'';
    throw err;
  }
  return body;
}
async function fetchUser(accessToken){
  const res=await withTimeout(fetch(`${apiBase()}/auth/v1/user`,{headers:authHeaders(accessToken)}),7000,'Verifying your Google session');
  return parseResponse(res);
}
async function captureOAuthCallback(){
  if(!configured()||typeof location==='undefined')return null;
  const raw=location.hash?.startsWith('#')?location.hash.slice(1):'';
  if(!raw)return null;
  const p=new URLSearchParams(raw);
  const oauthError=p.get('error_description')||p.get('error');
  if(oauthError){
    history.replaceState(null,'',location.pathname+location.search);
    throw new Error(oauthError);
  }
  const access=p.get('access_token');
  if(!access)return null;
  let user=null;
  try{user=await fetchUser(access);}catch{user=decodeJwtUser(access);}
  if(!user?.id)throw new Error('Google sign-in completed, but the user session could not be read.');
  const expiresIn=Number(p.get('expires_in')||3600);
  const expiresAt=Number(p.get('expires_at')||0)||Math.floor(Date.now()/1000)+expiresIn;
  const session={
    access_token:access,
    refresh_token:p.get('refresh_token')||'',
    token_type:p.get('token_type')||'bearer',
    expires_in:expiresIn,
    expires_at:expiresAt,
    provider_token:p.get('provider_token')||undefined,
    provider_refresh_token:p.get('provider_refresh_token')||undefined,
    user
  };
  saveSession(session);
  history.replaceState(null,'',location.pathname+location.search);
  return session;
}
async function refreshSession(session){
  if(!session?.refresh_token)return null;
  const res=await withTimeout(fetch(`${apiBase()}/auth/v1/token?grant_type=refresh_token`,{
    method:'POST',headers:authHeaders(null,{'content-type':'application/json'}),body:JSON.stringify({refresh_token:session.refresh_token})
  }),8000,'Refreshing your session');
  const data=await parseResponse(res);
  const user=data.user||decodeJwtUser(data.access_token);
  if(!data.access_token||!user?.id)return null;
  return saveSession({...data,user,expires_at:data.expires_at||Math.floor(Date.now()/1000)+Number(data.expires_in||3600)});
}
export function peekSession(){return readStoredSession();}
export async function currentSession(){
  const stored=readStoredSession();
  if(stored?.local_only)return stored;
  if(!configured())return null;
  const callback=await captureOAuthCallback();
  if(callback)return callback;
  const session=stored;
  if(!session)return null;
  const now=Math.floor(Date.now()/1000);
  if(!navigator.onLine)return {...session,offline_cached:true};
  if(!session.expires_at||Number(session.expires_at)>now+45)return session;
  try{return await refreshSession(session);}catch{clearLocalAuth();return null;}
}
export async function signInWithGoogle(redirectTo){
  if(!configured())throw new Error('Google sign-in is not configured.');
  sessionStorage.setItem('smd-oauth-inflight','1');
  const u=new URL(`${apiBase()}/auth/v1/authorize`);
  u.searchParams.set('provider','google');
  u.searchParams.set('redirect_to',redirectTo);
  // GoTrue forwards supported provider query params to Google.
  u.searchParams.set('prompt','select_account');
  location.assign(u.toString());
  return {url:u.toString()};
}
export async function signOut(){
  const session=readStoredSession();
  clearLocalAuth();
  if(session?.access_token&&!session?.local_only&&navigator.onLine){
    try{await withTimeout(fetch(`${apiBase()}/auth/v1/logout?scope=local`,{method:'POST',headers:authHeaders(session.access_token)}),3500,'Signing out');}catch{}
  }
}

class RestBuilder{
  constructor(table){this.table=table;this.method='GET';this.body=null;this.filters=[];this.params=new URLSearchParams();this.wantRepresentation=false;}
  select(cols='*'){this.params.set('select',cols||'*');if(this.method!=='GET')this.wantRepresentation=true;return this;}
  insert(value){this.method='POST';this.body=value;return this;}
  update(value){this.method='PATCH';this.body=value;return this;}
  delete(){this.method='DELETE';return this;}
  eq(col,value){this.filters.push([col,`eq.${value}`]);return this;}
  order(col,{ascending=true}={}){this.params.set('order',`${col}.${ascending?'asc':'desc'}`);return this;}
  async single(){const r=await this._execute();if(r.error)return r;const arr=Array.isArray(r.data)?r.data:[];if(arr.length!==1)return {data:null,error:new Error(arr.length?'Expected one row.':'No row found.')};return {data:arr[0],error:null};}
  async maybeSingle(){const r=await this._execute();if(r.error)return r;const arr=Array.isArray(r.data)?r.data:[];return {data:arr[0]||null,error:null};}
  then(resolve,reject){return this._execute().then(resolve,reject);}
  async _execute(){
    try{
      const session=await currentSession();
      const url=new URL(`${apiBase()}/rest/v1/${encodeURIComponent(this.table)}`);
      for(const [k,v] of this.params)url.searchParams.set(k,v);
      for(const [k,v] of this.filters)url.searchParams.append(k,v);
      const headers=authHeaders(session?.access_token,{});
      const opts={method:this.method,headers};
      if(this.method!=='GET'&&this.body!==null){headers['content-type']='application/json';opts.body=JSON.stringify(this.body);}
      if(this.method==='POST'||this.method==='PATCH')headers.Prefer=this.wantRepresentation?'return=representation':'return=minimal';
      const res=await withTimeout(fetch(url.toString(),opts),9000,'Cloud data request');
      if(!res.ok)await parseResponse(res);
      if(res.status===204)return {data:null,error:null};
      const text=await res.text();const data=text?jsonParse(text):null;
      return {data,error:null};
    }catch(error){return {data:null,error};}
  }
}
class RestClient{
  constructor(){
    this.auth={
      getSession:async()=>({data:{session:await currentSession()},error:null}),
      getUser:async()=>{const s=await currentSession();return {data:{user:s?.user||null},error:null};},
      signOut:async()=>{await signOut();return {error:null};}
    };
  }
  from(table){return new RestBuilder(table);}
  async rpc(name,args={}){
    try{
      const session=await currentSession();
      const res=await withTimeout(fetch(`${apiBase()}/rest/v1/rpc/${encodeURIComponent(name)}`,{
        method:'POST',headers:authHeaders(session?.access_token,{'content-type':'application/json'}),body:JSON.stringify(args||{})
      }),9000,'Cloud account request');
      const data=await parseResponse(res);
      return {data,error:null};
    }catch(error){return {data:null,error};}
  }
}
let client=null;
export async function getSupabase(){
  if(!configured())return null;
  if(!client)client=new RestClient();
  return client;
}
export async function getMyProfile(){
  const sess=await currentSession();if(!sess)return null;
  if(sess.local_only){const p=localProfile()||{};return {email:sess.user.email,is_owner:false,allow_owner_review:false,privacy_ack_at:p.privacy_ack_at||null,local_only:true};}
  const sb=await getSupabase();if(!sb)return null;
  const {data,error}=await sb.from('profiles').select('email,is_owner,allow_owner_review,privacy_ack_at').eq('id',sess.user.id).single();
  if(error)return null;return data;
}
export async function setOwnerReviewConsent(value){
  const sess=await currentSession();if(sess?.local_only){const p=localProfile()||{};p.allow_owner_review=false;p.privacy_ack_at=p.privacy_ack_at||new Date().toISOString();saveLocalProfile(p);return false;}
  const sb=await getSupabase();if(!sb)throw new Error('Cloud account is unavailable.');
  const {error}=await sb.rpc('set_owner_review_consent',{p_allow:!!value});if(error)throw error;return !!value;
}
export async function logEvent(type,metadata={}){
  try{
    const sess=await currentSession();if(!sess?.user)return;
    if(sess.local_only){const rows=getLocalEvents();rows.unshift({id:`evt-${Date.now()}`,user_id:sess.user.id,event_type:type,metadata,created_at:new Date().toISOString()});localStorage.setItem(LOCAL_EVENTS_KEY,JSON.stringify(rows.slice(0,200)));return;}
    const sb=await getSupabase();if(!sb)return;
    await sb.from('user_events').insert({user_id:sess.user.id,event_type:type,metadata,user_agent:navigator.userAgent.slice(0,500)});
    await sb.rpc('touch_last_seen');
  }catch{}
}
