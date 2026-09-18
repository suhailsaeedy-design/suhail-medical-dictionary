import './core.js';
import {CONFIG} from './config.js';
import {currentSession,signInWithGoogle,signOut,getMyProfile,setOwnerReviewConsent,logEvent} from './auth.js';

const $=s=>document.querySelector(s);
const RTL=new Set(['ps','prs','fa','ar']);
const TEXT={
 en:{welcome:'Welcome',title:'Continue with Google',sub:'Use your Google account to open your private study workspace. No new password is required.',google:'Continue with Google',working:'Opening Google…',needConfig:'Google sign-in is not configured yet. The owner must connect Supabase and Google OAuth first.',securityTitle:'Your Google password stays with Google.',securityBody:'This website never asks for, receives, or stores your Google password.',consentTitle:'One-time account setup',consentSub:'Accept the Privacy Notice and Terms before opening your workspace.',accept:'I accept the Privacy Notice and Terms.',review:'Optional: allow the owner to review my stored chat content for support and quality.',continue:'Continue to my workspace',signout:'Use another Google account',signed:'Signed in as'},
 ps:{welcome:'ښه راغلاست',title:'د Google له لارې ننوځئ',sub:'په خپل Google حساب شخصي درسي Workspace خلاص کړئ. نوی پاسورډ جوړولو ته اړتیا نشته.',google:'د Google له لارې دوام',working:'Google پرانیستل کېږي…',needConfig:'Google Login لا نه دی تنظیم شوی. Owner باید لومړی Supabase او Google OAuth وصل کړي.',securityTitle:'ستاسو د Google پاسورډ له Google سره پاتې کېږي.',securityBody:'دا ویب‌سایټ ستاسو د Google پاسورډ نه غواړي، نه یې ترلاسه کوي او نه یې ذخیره کوي.',consentTitle:'د حساب یو ځل تنظیم',consentSub:'Workspace ته له ننوتلو مخکې Privacy Notice او Terms ومنئ.',accept:'زه Privacy Notice او Terms منم.',review:'اختیاري: Owner ته اجازه ورکوم چې د Support او Quality لپاره زما ذخیره شوي Chatونه وګوري.',continue:'خپل Workspace ته دوام',signout:'بل Google حساب استعمالول',signed:'داخل شوی حساب'},
 prs:{welcome:'خوش آمدید',title:'با Google وارد شوید',sub:'با حساب Google خود فضای خصوصی مطالعه را باز کنید. نیازی به ساختن رمز جدید نیست.',google:'ادامه با Google',working:'Google باز می‌شود…',needConfig:'ورود Google هنوز تنظیم نشده است. مالک باید Supabase و Google OAuth را وصل کند.',securityTitle:'رمز Google شما نزد Google می‌ماند.',securityBody:'این وب‌سایت رمز Google شما را نمی‌خواهد، دریافت نمی‌کند و ذخیره نمی‌کند.',consentTitle:'تنظیم یک‌باره حساب',consentSub:'پیش از ورود، Privacy Notice و Terms را بپذیرید.',accept:'Privacy Notice و Terms را می‌پذیرم.',review:'اختیاری: اجازه می‌دهم مالک برای پشتیبانی و کیفیت چت‌های ذخیره‌شده را بررسی کند.',continue:'ادامه به فضای من',signout:'استفاده از حساب Google دیگر',signed:'حساب واردشده'},
 fa:{welcome:'خوش آمدید',title:'با Google وارد شوید',sub:'با حساب Google وارد فضای خصوصی مطالعه شوید. نیازی به ساخت رمز جدید نیست.',google:'ادامه با Google',working:'در حال باز کردن Google…',needConfig:'ورود Google هنوز تنظیم نشده است. مدیر باید Supabase و Google OAuth را متصل کند.',securityTitle:'رمز Google شما نزد Google می‌ماند.',securityBody:'این وب‌سایت رمز Google شما را درخواست، دریافت یا ذخیره نمی‌کند.',consentTitle:'راه‌اندازی یک‌باره حساب',consentSub:'پیش از ورود، Privacy Notice و Terms را بپذیرید.',accept:'Privacy Notice و Terms را می‌پذیرم.',review:'اختیاری: اجازه بررسی چت‌های ذخیره‌شده برای پشتیبانی و کیفیت.',continue:'ادامه به فضای من',signout:'استفاده از حساب Google دیگر',signed:'حساب واردشده'},
 tr:{welcome:'Hoş geldiniz',title:'Google ile devam edin',sub:'Özel çalışma alanınızı Google hesabınızla açın. Yeni parola oluşturmanız gerekmez.',google:'Google ile devam et',working:'Google açılıyor…',needConfig:'Google girişi henüz yapılandırılmadı. Yönetici Supabase ve Google OAuth bağlantısını tamamlamalıdır.',securityTitle:'Google parolanız Google’da kalır.',securityBody:'Bu site Google parolanızı istemez, almaz veya saklamaz.',consentTitle:'Tek seferlik hesap kurulumu',consentSub:'Çalışma alanını açmadan önce Gizlilik Bildirimi ve Koşulları kabul edin.',accept:'Gizlilik Bildirimi ve Koşulları kabul ediyorum.',review:'İsteğe bağlı: destek ve kalite için kayıtlı sohbetlerimin incelenmesine izin ver.',continue:'Çalışma alanıma devam et',signout:'Başka bir Google hesabı kullan',signed:'Giriş yapılan hesap'},
 ar:{welcome:'مرحباً',title:'المتابعة باستخدام Google',sub:'افتح مساحة الدراسة الخاصة بك بحساب Google. لا تحتاج إلى إنشاء كلمة مرور جديدة.',google:'المتابعة باستخدام Google',working:'جارٍ فتح Google…',needConfig:'تسجيل الدخول عبر Google غير مُعد بعد. يجب على المالك ربط Supabase وGoogle OAuth.',securityTitle:'كلمة مرور Google تبقى لدى Google.',securityBody:'هذا الموقع لا يطلب كلمة مرور Google ولا يستلمها ولا يخزنها.',consentTitle:'إعداد الحساب لمرة واحدة',consentSub:'اقبل إشعار الخصوصية والشروط قبل فتح مساحة الدراسة.',accept:'أوافق على إشعار الخصوصية والشروط.',review:'اختياري: السماح للمالك بمراجعة المحادثات المحفوظة للدعم والجودة.',continue:'المتابعة إلى مساحتي',signout:'استخدام حساب Google آخر',signed:'الحساب المسجل'},
 zh:{welcome:'欢迎',title:'使用 Google 继续',sub:'使用你的 Google 账号进入私人学习空间，无需创建新密码。',google:'使用 Google 继续',working:'正在打开 Google…',needConfig:'Google 登录尚未配置。管理员需要先连接 Supabase 和 Google OAuth。',securityTitle:'你的 Google 密码只由 Google 保管。',securityBody:'本网站不会请求、接收或存储你的 Google 密码。',consentTitle:'一次性账户设置',consentSub:'进入学习空间前，请接受隐私声明和条款。',accept:'我接受隐私声明和条款。',review:'可选：允许站点所有者为支持和质量目的查看我保存的聊天。',continue:'进入我的学习空间',signout:'使用其他 Google 账号',signed:'已登录账号'}
};
function lang(){return localStorage.getItem('smd-ui-lang')||'en';}
function t(){return TEXT[lang()]||TEXT.en;}
function applyLanguage(code){localStorage.setItem('smd-ui-lang',code);document.documentElement.lang=code;document.documentElement.dir=RTL.has(code)?'rtl':'ltr';$('#loginLanguage').value=code;render();}
function render(){const x=t();$('#authKicker').textContent=x.welcome;$('#authTitle').textContent=x.title;$('#authSubtitle').textContent=x.sub;$('#googleButtonText').textContent=x.google;$('#securityTitle').textContent=x.securityTitle;$('#securityBody').textContent=x.securityBody;$('#consentTitle').textContent=x.consentTitle;$('#consentSubtitle').textContent=x.consentSub;$('#privacyAcceptText').textContent=x.accept;$('#ownerReviewText').textContent=x.review;$('#consentContinue').textContent=x.continue;$('#useAnotherGoogle').textContent=x.signout;}
function showMessage(msg,type='info'){for(const id of ['#authMessage','#authMessageConsent']){const el=$(id);if(!el)continue;el.textContent=msg;el.className=`auth-message ${type}`;}}
function showConsent(session){const x=t();$('#googleSignInPanel').classList.add('hidden');$('#consentPanel').classList.remove('hidden');$('#signedInAs').textContent=`${x.signed}: ${session.user.email||''}`;}
async function loadProfileWithRetry(){for(let i=0;i<5;i++){const p=await getMyProfile();if(p)return p;await new Promise(r=>setTimeout(r,250));}return null;}
async function finishExistingSession(session){const profile=await loadProfileWithRetry();if(profile?.privacy_ack_at){await logEvent('login',{provider:'google'});location.replace('./app.html');return true;}showConsent(session);return false;}
async function init(){
 $('#year').textContent=new Date().getFullYear();applyLanguage(lang());
 $('#loginLanguage').addEventListener('change',e=>applyLanguage(e.target.value));
 $('#googleSignIn').addEventListener('click',startGoogle);
 $('#consentContinue').addEventListener('click',saveConsent);
 $('#useAnotherGoogle').addEventListener('click',async()=>{await signOut();location.replace('./index.html');});
 if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey){showMessage(t().needConfig,'warning');return;}
 try{const s=await currentSession();if(s)await finishExistingSession(s);}catch(err){showMessage(err.message||'Sign-in could not be completed.','error');}
}
async function startGoogle(){
 if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey){showMessage(t().needConfig,'warning');return;}
 const btn=$('#googleSignIn');btn.disabled=true;$('#googleButtonText').textContent=t().working;showMessage('');
 try{const redirectTo=new URL('./index.html',window.location.href).href.split('#')[0];await signInWithGoogle(redirectTo);}catch(err){showMessage(err.message||'Google sign-in could not be started.','error');btn.disabled=false;render();}
}
async function saveConsent(){
 if(!$('#privacyAccept').checked){showMessage(t().accept,'warning');return;}
 const btn=$('#consentContinue');btn.disabled=true;showMessage('');
 try{await setOwnerReviewConsent($('#ownerReviewOptIn').checked);await logEvent('signup_or_consent',{provider:'google',privacyAccepted:true,ownerReview:$('#ownerReviewOptIn').checked});location.replace('./app.html');}
 catch(err){showMessage(err.message||'Account setup could not be completed.','error');btn.disabled=false;}
}
init();
