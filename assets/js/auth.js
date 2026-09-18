import {CONFIG} from './config.js';

const SDK_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';
const AUTH_STORAGE_KEY='smd-auth-v3-3';
const DEFAULT_TIMEOUT=7000;
let supabase=null;
let sdkPromise=null;

function timeout(promise,ms=DEFAULT_TIMEOUT,label='Authentication request'){
  let timer;
  return Promise.race([
    promise,
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out. Please retry.`)),ms);})
  ]).finally(()=>clearTimeout(timer));
}
function storageSession(){
  try{
    const raw=localStorage.getItem(AUTH_STORAGE_KEY);
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    const sess=parsed?.currentSession||parsed?.session||parsed;
    if(!sess?.access_token||!sess?.user)return null;
    if(sess.expires_at&&Number(sess.expires_at)*1000<Date.now()-30000)return null;
    return sess;
  }catch{return null;}
}
function clearLegacyStorage(){
  try{
    const ref=new URL(CONFIG.supabaseUrl).hostname.split('.')[0];
    const legacy=`sb-${ref}-auth-token`;
    if(legacy!==AUTH_STORAGE_KEY)localStorage.removeItem(legacy);
  }catch{}
}
export async function getSupabase(){
  if(supabase)return supabase;
  if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey)return null;
  if(!sdkPromise)sdkPromise=import(SDK_URL);
  try{
    const {createClient}=await timeout(sdkPromise,10000,'Loading secure sign-in');
    supabase=createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey,{
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true,
        storageKey:AUTH_STORAGE_KEY
      }
    });
    clearLegacyStorage();
    return supabase;
  }catch(err){
    sdkPromise=null;
    throw err;
  }
}
export async function currentSession({waitMs=7000,allowStorageFallback=true}={}){
  // Fast path: Supabase stores the browser session locally. Reading it directly
  // avoids rare Web Locks/getSession stalls and lets the offline dictionary open.
  if(allowStorageFallback){
    const cached=storageSession();
    if(cached)return cached;
  }
  try{
    const sb=await getSupabase();
    if(!sb)return null;
    const {data,error}=await timeout(sb.auth.getSession(),waitMs,'Checking your session');
    if(error)throw error;
    return data?.session||null;
  }catch(err){
    if(allowStorageFallback){
      const fallback=storageSession();
      if(fallback)return fallback;
    }
    throw err;
  }
}
export async function signInWithGoogle(redirectTo){
  const sb=await getSupabase();
  if(!sb)throw new Error('Google sign-in is not configured or is temporarily unavailable.');
  sessionStorage.setItem('smd-oauth-inflight','1');
  const {data,error}=await timeout(sb.auth.signInWithOAuth({
    provider:'google',
    options:{
      redirectTo,
      queryParams:{prompt:'select_account',include_granted_scopes:'true'}
    }
  }),10000,'Starting Google sign-in');
  if(error){sessionStorage.removeItem('smd-oauth-inflight');throw error;}
  return data;
}
function clearLocalAuth(){
  try{localStorage.removeItem(AUTH_STORAGE_KEY);}catch{}
  try{sessionStorage.removeItem('smd-oauth-inflight');}catch{}
}
export async function signOut(){
  try{
    const sb=await getSupabase();
    if(sb)await timeout(sb.auth.signOut({scope:'local'}),5000,'Signing out');
  }catch{}finally{clearLocalAuth();}
}
export async function getMyProfile(){
  const sb=await getSupabase();
  const sess=await currentSession();
  if(!sb||!sess)return null;
  try{
    const {data,error}=await timeout(sb.from('profiles').select('email,is_owner,allow_owner_review,privacy_ack_at').eq('id',sess.user.id).single(),7000,'Loading your profile');
    if(error)return null;
    return data;
  }catch{return null;}
}
export async function setOwnerReviewConsent(value){
  const sb=await getSupabase();
  if(!sb)throw new Error('Cloud account is unavailable.');
  const {error}=await timeout(sb.rpc('set_owner_review_consent',{p_allow:!!value}),7000,'Saving account settings');
  if(error)throw error;
  return !!value;
}
export async function logEvent(type,metadata={}){
  const sb=await getSupabase().catch(()=>null);if(!sb)return;
  try{
    const userResult=await timeout(sb.auth.getUser(),6000,'Checking user');
    const user=userResult?.data?.user;if(!user)return;
    await timeout(sb.from('user_events').insert({user_id:user.id,event_type:type,metadata,user_agent:navigator.userAgent.slice(0,500)}),6000,'Saving activity');
    await timeout(sb.rpc('touch_last_seen'),6000,'Updating activity');
  }catch{}
}
