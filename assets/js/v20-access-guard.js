import {peekSession,currentSession,getMyProfile,hasPrivacyConsent,rememberPrivacyConsent} from './auth.js?v=20.19.2';

const next=encodeURIComponent(location.pathname.split('/').pop()+(location.search||'')+(location.hash||''));
async function guard(){
  let session=peekSession();
  if(!session){try{session=await currentSession();}catch{session=null;}}
  if(!session){location.replace(`./index.html?next=${next}`);return;}
  if(hasPrivacyConsent(session)){document.documentElement.dataset.accessReady='1';return;}
  try{const profile=await getMyProfile();if(profile?.privacy_ack_at){rememberPrivacyConsent(session,profile.privacy_ack_at);document.documentElement.dataset.accessReady='1';return;}}catch{}
  location.replace(`./index.html?consent=1&next=${next}`);
}
guard();
