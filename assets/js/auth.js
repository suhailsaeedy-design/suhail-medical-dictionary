import {CONFIG} from './config.js';
let supabase=null,failed=false;
export async function getSupabase(){
 if(supabase)return supabase;if(failed)return null;
 if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey)return null;
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  supabase=createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return supabase;
 }catch(e){if(!navigator.onLine)failed=false;else failed=true;return null;}
}
export async function currentSession(){const sb=await getSupabase();if(!sb)return null;try{const {data}=await sb.auth.getSession();return data.session;}catch{return null;}}
export async function signIn(email,password){const sb=await getSupabase();if(!sb)throw new Error('Cloud login is not configured or is temporarily unavailable.');const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;await logEvent('login');return data;}
export async function signUp(email,password,{privacyAccepted=false,ownerReview=false}={}){
 if(!privacyAccepted)throw new Error('Please accept the Privacy Notice and Terms first.');
 const sb=await getSupabase();if(!sb)throw new Error('Cloud login is not configured or is temporarily unavailable.');
 const {data,error}=await sb.auth.signUp({email,password,options:{data:{privacy_accepted:true,allow_owner_review:!!ownerReview}}});if(error)throw error;
 if(data.session){await setOwnerReviewConsent(!!ownerReview);await logEvent('signup',{privacyAccepted:true,ownerReview:!!ownerReview});}return data;
}
export async function signOut(){const sb=await getSupabase();if(sb)await sb.auth.signOut();}
export async function getMyProfile(){const sb=await getSupabase();const sess=await currentSession();if(!sb||!sess)return null;const {data,error}=await sb.from('profiles').select('email,is_owner,allow_owner_review,privacy_ack_at').eq('id',sess.user.id).single();if(error)return null;return data;}
export async function setOwnerReviewConsent(value){const sb=await getSupabase();if(!sb)throw new Error('Cloud account is unavailable.');const {error}=await sb.rpc('set_owner_review_consent',{p_allow:!!value});if(error)throw error;return !!value;}
export async function logEvent(type,metadata={}){const sb=await getSupabase();if(!sb)return;try{const {data:{user}}=await sb.auth.getUser();if(!user)return;await sb.from('user_events').insert({user_id:user.id,event_type:type,metadata,user_agent:navigator.userAgent.slice(0,500)});await sb.rpc('touch_last_seen');}catch{}}
