import {CONFIG} from './config.js?v=20.16.0';
import {currentSession,signInWithGoogle,signInLocal,getSavedLocalProfile,cloudConfigured,signOut,getMyProfile,setOwnerReviewConsent,logEvent} from './auth.js?v=20.16.0';

const $=s=>document.querySelector(s);
const RTL=new Set(['ps','prs','fa','ar']);
const T={
 en:{title:'Welcome Back',sub:'Choose how you want to continue.',current:'Sign in with current email',none:'No saved account on this device',other:'Sign in with Other email',choose:'Choose a Google account',opening:'Opening Google…',offline:'Offline — local sign-in is available'},
 ps:{title:'ښه راغلاست',sub:'د ننوتلو لاره وټاکئ.',current:'له اوسني ایمیل سره ننوتل',none:'په دې وسیله کې حساب نه دی خوندي',other:'له بل ایمیل سره ننوتل',choose:'بل Google حساب وټاکئ',opening:'Google پرانیستل کېږي…',offline:'افلاین — محلي ننوتل کار کوي'},
 prs:{title:'خوش آمدید',sub:'روش ورود را انتخاب کنید.',current:'ورود با ایمیل فعلی',none:'حساب ذخیره‌شده وجود ندارد',other:'ورود با ایمیل دیگر',choose:'یک حساب Google دیگر انتخاب کنید',opening:'Google باز می‌شود…',offline:'آفلاین — ورود محلی در دسترس است'},
 fa:{title:'خوش آمدید',sub:'روش ورود را انتخاب کنید.',current:'ورود با ایمیل فعلی',none:'حساب ذخیره‌شده وجود ندارد',other:'ورود با ایمیل دیگر',choose:'یک حساب Google دیگر انتخاب کنید',opening:'در حال باز کردن Google…',offline:'آفلاین — ورود محلی در دسترس است'},
 ar:{title:'مرحباً بعودتك',sub:'اختر طريقة المتابعة.',current:'تسجيل الدخول بالبريد الحالي',none:'لا يوجد حساب محفوظ على هذا الجهاز',other:'تسجيل الدخول ببريد آخر',choose:'اختر حساب Google آخر',opening:'جارٍ فتح Google…',offline:'غير متصل — تسجيل الدخول المحلي متاح'},
 tr:{title:'Tekrar hoş geldiniz',sub:'Nasıl devam edeceğinizi seçin.',current:'Mevcut e-posta ile giriş yap',none:'Bu cihazda kayıtlı hesap yok',other:'Başka e-posta ile giriş yap',choose:'Başka bir Google hesabı seç',opening:'Google açılıyor…',offline:'Çevrimdışı — yerel giriş kullanılabilir'},
 zh:{title:'欢迎回来',sub:'选择继续方式。',current:'使用当前邮箱登录',none:'此设备没有已保存账号',other:'使用其他邮箱登录',choose:'选择另一个 Google 账号',opening:'正在打开 Google…',offline:'离线 — 可使用本地登录'}
};
let session=null, profile=null;
function lang(){return localStorage.getItem('smd-ui-lang')||'en'}
function tx(){return T[lang()]||T.en}
function setStatus(msg='',type=''){const el=$('#authStatus');el.textContent=msg;el.className='v20-auth-status'+(type?' '+type:'')}
function updateOnline(){const on=navigator.onLine;$('#loginOnline').classList.toggle('offline',!on);$('#loginOnline').querySelector('span').textContent=on?'Online':'Offline';if(!on&&!session)setStatus(tx().offline,'warning')}
function applyLanguage(code){localStorage.setItem('smd-ui-lang',code);document.documentElement.lang=code;document.documentElement.dir=RTL.has(code)?'rtl':'ltr';const t=T[code]||T.en;$('#loginTitle').textContent=t.title;$('#loginSubtitle').textContent=t.sub;$('#currentAccountText').textContent=t.current;$('#otherAccountText').textContent=t.other;if(!session)$('#currentEmailText').textContent=t.none}
function applyTheme(){const stored=localStorage.getItem('smd-theme')||'dark';const theme=stored==='clinical'?'light':'dark';document.body.dataset.theme=theme;$('#loginTheme').querySelector('span').textContent=theme==='dark'?'Dark':'Light';$('#loginTheme').querySelector('i').className=theme==='dark'?'bi bi-moon-stars-fill':'bi bi-sun-fill'}
async function loadProfile(){try{return await getMyProfile()}catch{return null}}
async function routeCurrent(){if(!session){const saved=getSavedLocalProfile();if(saved?.email)session=await signInLocal(saved.email);else return;}if(!profile)profile=await loadProfile();if(profile?.privacy_ack_at){logEvent('login',{provider:session?.local_only?'local':'google',mode:'current'}).catch(()=>{});location.replace('./app.html');return}const modal=bootstrap.Modal.getOrCreateInstance($('#consentModal'));$('#consentEmail').textContent=session.user?.email||'';modal.show()}
async function startOther(){
  if(CONFIG.zeroCostMode&&CONFIG.localAccountFallback){
    const input=$('#localEmailInput');if(input)input.value='';
    const modal=bootstrap.Modal.getOrCreateInstance($('#localAccountModal'));modal.show();setTimeout(()=>input?.focus(),220);return;
  }
  if(!navigator.onLine){setStatus(tx().offline,'warning');return}
  setStatus(tx().opening);$('#otherAccountBtn').disabled=true;try{await signOut();const redirect=new URL('./index.html',location.href).href.split('#')[0].split('?')[0];await signInWithGoogle(redirect)}catch(err){setStatus(err?.message||'Could not start Google sign-in.','error');$('#otherAccountBtn').disabled=false}
}
async function saveLocalAccount(){const input=$('#localEmailInput'),status=$('#localAccountStatus'),btn=$('#localAccountContinue');const email=String(input?.value||'').trim();if(status){status.textContent='';status.className='v20-auth-status';}if(btn)btn.disabled=true;try{await signOut();session=await signInLocal(email);profile=await loadProfile();$('#currentEmailText').textContent=session.user?.email||email;$('#currentAccountBtn').disabled=false;bootstrap.Modal.getInstance($('#localAccountModal'))?.hide();await routeCurrent();}catch(err){if(status){status.textContent=err?.message||'Could not save this local account.';status.className='v20-auth-status error';}}finally{if(btn)btn.disabled=false;}}
async function saveConsent(){if(!$('#privacyAccept').checked){$('#consentStatus').textContent='Please accept the Privacy Notice and Terms.';return}const btn=$('#consentContinue');btn.disabled=true;try{await setOwnerReviewConsent($('#ownerReviewOptIn').checked);logEvent('signup_or_consent',{provider:session?.local_only?'local':'google',privacyAccepted:true}).catch(()=>{});location.replace('./app.html')}catch(err){$('#consentStatus').textContent=err?.message||'Could not save account setup.';btn.disabled=false}}
async function loadPublicStats(){
 try{const idx=await fetch('./data/index.json',{cache:'force-cache'}).then(r=>r.ok?r.json():Promise.reject());const tc=$('#loginTermCount'),cc=$('#loginCategoryCount');if(tc)tc.textContent=Number(idx.term_count||idx.terms?.length||1158).toLocaleString();if(cc)cc.textContent=Number(idx.categories?.length||17).toLocaleString();}catch{}
 const lc=$('#loginLanguageCount');if(lc)lc.textContent=String($('#loginLanguage')?.options?.length||7);
}
async function init(){
 $('#year').textContent=new Date().getFullYear();$('#loginLanguage').value=lang();applyLanguage(lang());applyTheme();updateOnline();loadPublicStats();
 if(CONFIG.zeroCostMode&&CONFIG.localAccountFallback){const hint=$('#otherAccountHint');if(hint)hint.textContent='Use another email on this device';}
 $('#loginLanguage').addEventListener('change',e=>applyLanguage(e.target.value));
 $('#loginTheme').addEventListener('click',()=>{const next=document.body.dataset.theme==='dark'?'light':'dark';localStorage.setItem('smd-theme',next==='light'?'clinical':'dark');applyTheme()});
 $('#currentAccountBtn').addEventListener('click',routeCurrent);$('#otherAccountBtn').addEventListener('click',startOther);$('#consentContinue').addEventListener('click',saveConsent);$('#localAccountContinue')?.addEventListener('click',saveLocalAccount);$('#localEmailInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveLocalAccount();}});addEventListener('online',updateOnline);addEventListener('offline',updateOnline);
 const savedLocal=getSavedLocalProfile();
 try{session=await currentSession();if(session){profile=await loadProfile();$('#currentAccountBtn').disabled=false;$('#currentEmailText').textContent=session.user?.email||'Saved account';const fromOAuth=sessionStorage.getItem('smd-oauth-inflight')==='1';sessionStorage.removeItem('smd-oauth-inflight');if(fromOAuth)await routeCurrent()}else if(savedLocal?.email){$('#currentAccountBtn').disabled=false;$('#currentEmailText').textContent=savedLocal.email}else{$('#currentAccountBtn').disabled=true}if(CONFIG.zeroCostMode&&CONFIG.localAccountFallback)setStatus('Zero-Cost Mode · local account available offline.','success');else if(!cloudConfigured())setStatus('Cloud sign-in is not configured yet.','warning')}
 catch(err){setStatus(err?.message||'Sign-in could not be completed.','error')}
}
init();
