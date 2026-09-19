import './core.js?v=17.0.0';
import {CONFIG} from './config.js?v=17.0.0';
import {currentSession,signInWithGoogle,signOut,getMyProfile,setOwnerReviewConsent,logEvent} from './auth.js?v=17.0.0';

const $=s=>document.querySelector(s);
const RTL=new Set(['ps','prs','fa','ar']);
const TEXT={
 en:{welcome:'Welcome',title:'Continue with Google',sub:'Choose the Google account you want to use. This site never asks for a new password.',google:'Choose a Google account',working:'Opening Google…',needConfig:'Google sign-in is not configured yet. The owner must connect Supabase and Google OAuth first.',securityTitle:'Your Google password stays with Google.',securityBody:'This website never asks for, receives, or stores your Google password.',consentTitle:'One-time account setup',consentSub:'Accept the Privacy Notice and Terms before opening your workspace.',accept:'I accept the Privacy Notice and Terms.',review:'Optional: allow the owner to review my stored chat content for support and quality.',continue:'Continue to my workspace',another:'Use another Google account',signed:'Signed in as',returning:'A Google account is already signed in on this device.',continueCurrent:'Continue with this account'},
 ps:{welcome:'ښه راغلاست',title:'د Google حساب وټاکئ',sub:'هغه Google حساب وټاکئ چې غواړئ له همدې سره سیستم وکاروئ. نوی پاسورډ ته اړتیا نشته.',google:'Google حساب وټاکئ',working:'Google پرانیستل کېږي…',needConfig:'Google Login لا نه دی تنظیم شوی. Owner باید لومړی Supabase او Google OAuth وصل کړي.',securityTitle:'ستاسو د Google پاسورډ له Google سره پاتې کېږي.',securityBody:'دا ویب‌سایټ ستاسو د Google پاسورډ نه غواړي، نه یې ترلاسه کوي او نه یې ذخیره کوي.',consentTitle:'د حساب یو ځل تنظیم',consentSub:'Workspace ته له ننوتلو مخکې Privacy Notice او Terms ومنئ.',accept:'زه Privacy Notice او Terms منم.',review:'اختیاري: Owner ته اجازه ورکوم چې د Support او Quality لپاره زما ذخیره شوي Chatونه وګوري.',continue:'خپل Workspace ته دوام',another:'بل Google حساب استعمالول',signed:'داخل شوی حساب',returning:'په دې وسیله کې یو Google حساب لا داخل دی.',continueCurrent:'په همدې حساب دوام'},
 prs:{welcome:'خوش آمدید',title:'حساب Google را انتخاب کنید',sub:'حساب Google مورد نظر را انتخاب کنید. نیازی به ساختن رمز جدید نیست.',google:'انتخاب حساب Google',working:'Google باز می‌شود…',needConfig:'ورود Google هنوز تنظیم نشده است.',securityTitle:'رمز Google شما نزد Google می‌ماند.',securityBody:'این وب‌سایت رمز Google شما را نمی‌خواهد، دریافت نمی‌کند و ذخیره نمی‌کند.',consentTitle:'تنظیم یک‌باره حساب',consentSub:'پیش از ورود، Privacy Notice و Terms را بپذیرید.',accept:'Privacy Notice و Terms را می‌پذیرم.',review:'اختیاری: اجازه بررسی چت‌های ذخیره‌شده برای پشتیبانی و کیفیت.',continue:'ادامه به فضای من',another:'استفاده از حساب Google دیگر',signed:'حساب واردشده',returning:'یک حساب Google در این دستگاه وارد شده است.',continueCurrent:'ادامه با همین حساب'},
 fa:{welcome:'خوش آمدید',title:'حساب Google را انتخاب کنید',sub:'حساب Google مورد نظر را انتخاب کنید. نیازی به ساخت رمز جدید نیست.',google:'انتخاب حساب Google',working:'در حال باز کردن Google…',needConfig:'ورود Google هنوز تنظیم نشده است.',securityTitle:'رمز Google شما نزد Google می‌ماند.',securityBody:'این وب‌سایت رمز Google شما را درخواست، دریافت یا ذخیره نمی‌کند.',consentTitle:'راه‌اندازی یک‌باره حساب',consentSub:'پیش از ورود، Privacy Notice و Terms را بپذیرید.',accept:'Privacy Notice و Terms را می‌پذیرم.',review:'اختیاری: اجازه بررسی چت‌های ذخیره‌شده برای پشتیبانی و کیفیت.',continue:'ادامه به فضای من',another:'استفاده از حساب Google دیگر',signed:'حساب واردشده',returning:'یک حساب Google در این دستگاه وارد شده است.',continueCurrent:'ادامه با همین حساب'},
 tr:{welcome:'Hoş geldiniz',title:'Google hesabı seçin',sub:'Kullanmak istediğiniz Google hesabını seçin. Yeni parola gerekmez.',google:'Google hesabı seç',working:'Google açılıyor…',needConfig:'Google girişi henüz yapılandırılmadı.',securityTitle:'Google parolanız Google’da kalır.',securityBody:'Bu site Google parolanızı istemez, almaz veya saklamaz.',consentTitle:'Tek seferlik hesap kurulumu',consentSub:'Çalışma alanını açmadan önce Gizlilik Bildirimi ve Koşulları kabul edin.',accept:'Gizlilik Bildirimi ve Koşulları kabul ediyorum.',review:'İsteğe bağlı: destek ve kalite için kayıtlı sohbetlerimin incelenmesine izin ver.',continue:'Çalışma alanıma devam et',another:'Başka bir Google hesabı kullan',signed:'Giriş yapılan hesap',returning:'Bu cihazda bir Google hesabı zaten açık.',continueCurrent:'Bu hesapla devam et'},
 ar:{welcome:'مرحباً',title:'اختر حساب Google',sub:'اختر حساب Google الذي تريد استخدامه. لا حاجة لإنشاء كلمة مرور جديدة.',google:'اختيار حساب Google',working:'جارٍ فتح Google…',needConfig:'تسجيل الدخول عبر Google غير مُعد بعد.',securityTitle:'كلمة مرور Google تبقى لدى Google.',securityBody:'هذا الموقع لا يطلب كلمة مرور Google ولا يستلمها ولا يخزنها.',consentTitle:'إعداد الحساب لمرة واحدة',consentSub:'اقبل إشعار الخصوصية والشروط قبل فتح مساحة الدراسة.',accept:'أوافق على إشعار الخصوصية والشروط.',review:'اختياري: السماح للمالك بمراجعة المحادثات المحفوظة للدعم والجودة.',continue:'المتابعة إلى مساحتي',another:'استخدام حساب Google آخر',signed:'الحساب المسجل',returning:'يوجد حساب Google مسجل على هذا الجهاز.',continueCurrent:'المتابعة بهذا الحساب'},
 zh:{welcome:'欢迎',title:'选择 Google 账号',sub:'选择你想使用的 Google 账号，无需创建新密码。',google:'选择 Google 账号',working:'正在打开 Google…',needConfig:'Google 登录尚未配置。',securityTitle:'你的 Google 密码只由 Google 保管。',securityBody:'本网站不会请求、接收或存储你的 Google 密码。',consentTitle:'一次性账户设置',consentSub:'进入学习空间前，请接受隐私声明和条款。',accept:'我接受隐私声明和条款。',review:'可选：允许站点所有者为支持和质量目的查看我保存的聊天。',continue:'进入我的学习空间',another:'使用其他 Google 账号',signed:'已登录账号',returning:'此设备已有 Google 账号登录。',continueCurrent:'使用此账号继续'}
};
function lang(){return localStorage.getItem('smd-ui-lang')||'en';}
function t(){return TEXT[lang()]||TEXT.en;}
function applyLanguage(code){localStorage.setItem('smd-ui-lang',code);document.documentElement.lang=code;document.documentElement.dir=RTL.has(code)?'rtl':'ltr';$('#loginLanguage').value=code;render();}
function render(){const x=t();$('#authKicker').textContent=x.welcome;$('#authTitle').textContent=x.title;$('#authSubtitle').textContent=x.sub;$('#googleButtonText').textContent=x.google;$('#securityTitle').textContent=x.securityTitle;$('#securityBody').textContent=x.securityBody;$('#consentTitle').textContent=x.consentTitle;$('#consentSubtitle').textContent=x.consentSub;$('#privacyAcceptText').textContent=x.accept;$('#ownerReviewText').textContent=x.review;$('#consentContinue').textContent=x.continue;$('#useAnotherGoogle').textContent=x.another;$('#returningTitle').textContent=x.returning;$('#continueCurrent').textContent=x.continueCurrent;$('#returningAnother').textContent=x.another;}
function showMessage(msg,type='info'){for(const id of ['#authMessage','#authMessageConsent','#returningMessage']){const el=$(id);if(!el)continue;el.textContent=msg;el.className=`auth-message ${type}`;}}
function showGoogle(){ $('#returningPanel').classList.add('hidden');$('#consentPanel').classList.add('hidden');$('#googleSignInPanel').classList.remove('hidden'); }
function showConsent(session){const x=t();$('#googleSignInPanel').classList.add('hidden');$('#returningPanel').classList.add('hidden');$('#consentPanel').classList.remove('hidden');$('#signedInAs').textContent=`${x.signed}: ${session.user.email||''}`;}
function showReturning(session){const x=t();$('#googleSignInPanel').classList.add('hidden');$('#consentPanel').classList.add('hidden');$('#returningPanel').classList.remove('hidden');$('#returningEmail').textContent=`${x.signed}: ${session.user.email||''}`;}
async function loadProfileWithRetry(){for(let i=0;i<6;i++){const p=await getMyProfile();if(p)return p;await new Promise(r=>setTimeout(r,300));}return null;}
async function proceedSession(session,{fromOAuth=false}={}){const profile=await loadProfileWithRetry();if(profile?.privacy_ack_at){if(fromOAuth){logEvent('login',{provider:'google'}).catch(()=>{});location.replace('./app.html');return;}showReturning(session);return;}if(!profile&&!fromOAuth){showReturning(session);return;}showConsent(session);}
async function init(){
 $('#year').textContent=new Date().getFullYear();applyLanguage(lang());
 $('#loginLanguage').addEventListener('change',e=>applyLanguage(e.target.value));
 $('#googleSignIn').addEventListener('click',()=>startGoogle({resetLocal:true}));
 $('#consentContinue').addEventListener('click',saveConsent);
 $('#useAnotherGoogle').addEventListener('click',()=>startGoogle({resetLocal:true}));
 $('#returningAnother').addEventListener('click',()=>startGoogle({resetLocal:true}));
 $('#continueCurrent').addEventListener('click',async()=>{location.replace('./app.html');});
 if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey){showMessage(t().needConfig,'warning');return;}
 try{
   const s=await currentSession();
   if(s){const fromOAuth=sessionStorage.getItem('smd-oauth-inflight')==='1';sessionStorage.removeItem('smd-oauth-inflight');await proceedSession(s,{fromOAuth});}
   else showGoogle();
 }catch(err){showGoogle();showMessage(err.message||'Sign-in could not be completed.','warning');}
}
async function startGoogle({resetLocal=false}={}){
 if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey){showMessage(t().needConfig,'warning');return;}
 const btn=$('#googleSignIn');if(btn)btn.disabled=true;$('#googleButtonText').textContent=t().working;showMessage('');
 try{
   if(resetLocal)await signOut();
   const redirectTo=new URL('./index.html',window.location.href).href.split('#')[0].split('?')[0];
   await signInWithGoogle(redirectTo);
 }catch(err){showGoogle();showMessage(err.message||'Google sign-in could not be started.','error');if(btn)btn.disabled=false;render();}
}
async function saveConsent(){
 if(!$('#privacyAccept').checked){showMessage(t().accept,'warning');return;}
 const btn=$('#consentContinue');btn.disabled=true;showMessage('');
 try{await setOwnerReviewConsent($('#ownerReviewOptIn').checked);logEvent('signup_or_consent',{provider:'google',privacyAccepted:true,ownerReview:$('#ownerReviewOptIn').checked}).catch(()=>{});location.replace('./app.html');}
 catch(err){showMessage(err.message||'Account setup could not be completed.','error');btn.disabled=false;}
}
init();
