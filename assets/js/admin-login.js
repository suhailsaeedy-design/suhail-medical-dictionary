import {currentSession,getMyProfile,signInLocal} from './auth.js?v=20.18.1';
const $=s=>document.querySelector(s);const KEY='smd-admin-local-v1';
async function sha(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function status(t=''){ $('#adminLoginStatus').textContent=t }
async function init(){
 const session=await currentSession().catch(()=>null);if(session&&!session.local_only){const p=await getMyProfile().catch(()=>null);if(p?.is_owner){sessionStorage.setItem('smd-admin-unlocked-v1','1');location.replace('./admin.html');return;}}
 const rec=read();$('#adminSetup').hidden=!!rec;$('#adminUnlock').hidden=!rec;$('#adminIntro').textContent=rec?'Enter the owner passcode configured on this device.':'First-time setup: create local owner access for this device.';
 $('#adminCreate').onclick=async()=>{const email=$('#adminOwnerEmail').value.trim().toLowerCase(),a=$('#adminNewPass').value,b=$('#adminConfirmPass').value;if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return status('Enter a valid owner email.');if(a.length<8)return status('Use at least 8 characters.');if(a!==b)return status('Passcodes do not match.');localStorage.setItem(KEY,JSON.stringify({email,hash:await sha(a),created_at:new Date().toISOString()}));await signInLocal(email);sessionStorage.setItem('smd-admin-unlocked-v1','1');location.replace('./admin.html');};
 const unlock=async()=>{const r=read();if(!r)return location.reload();if(await sha($('#adminPass').value)!==r.hash)return status('Incorrect admin passcode.');const s=await currentSession().catch(()=>null);if(!s||s.user?.email!==r.email)await signInLocal(r.email);sessionStorage.setItem('smd-admin-unlocked-v1','1');location.replace('./admin.html');};$('#adminUnlockBtn').onclick=unlock;$('#adminPass').onkeydown=e=>{if(e.key==='Enter')unlock()};
}
init();
