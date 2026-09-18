import './core.js';
import {CONFIG} from './config.js';
import {currentSession,signIn,signUp} from './auth.js';

const $=s=>document.querySelector(s);
let mode='signin';
const RTL=new Set(['ps','prs','fa','ar']);
const TEXT={
 en:{welcome:'Welcome',titleIn:'Sign in to continue',subIn:'Use your email and password to open your private study workspace.',titleUp:'Create your student account',subUp:'Create one account for your private chats and study history.',in:'Sign in',up:'Create account',email:'Email address',password:'Password',show:'Show',hide:'Hide',working:'Please wait…',needConfig:'Cloud login is not configured yet. The owner must connect Supabase before accounts can be used.',created:'Account created. Check your email if email confirmation is enabled.'},
 ps:{welcome:'ښه راغلاست',titleIn:'د دوام لپاره ننوځئ',subIn:'په خپل ایمیل او پاسورډ خپل شخصي درسي حساب خلاص کړئ.',titleUp:'خپل محصل حساب جوړ کړئ',subUp:'د شخصي چټونو او زده کړې تاریخ لپاره یو حساب جوړ کړئ.',in:'ننوتل',up:'حساب جوړول',email:'ایمیل ادرس',password:'پاسورډ',show:'ښکاره',hide:'پټ',working:'لږ انتظار…',needConfig:'Cloud Login لا نه دی تنظیم شوی. Owner باید لومړی Supabase وصل کړي.',created:'حساب جوړ شو. که Email confirmation فعاله وي، خپل ایمیل وګورئ.'},
 prs:{welcome:'خوش آمدید',titleIn:'برای ادامه وارد شوید',subIn:'با ایمیل و رمز خود فضای خصوصی مطالعه را باز کنید.',titleUp:'حساب محصل بسازید',subUp:'برای چت‌ها و سابقه مطالعه یک حساب خصوصی بسازید.',in:'ورود',up:'ساخت حساب',email:'آدرس ایمیل',password:'رمز عبور',show:'نمایش',hide:'پنهان',working:'لطفاً صبر کنید…',needConfig:'ورود ابری هنوز تنظیم نشده است. مالک باید Supabase را وصل کند.',created:'حساب ساخته شد. اگر تأیید ایمیل فعال است، ایمیل خود را بررسی کنید.'},
 fa:{welcome:'خوش آمدید',titleIn:'برای ادامه وارد شوید',subIn:'با ایمیل و رمز عبور وارد فضای خصوصی مطالعه شوید.',titleUp:'حساب دانشجویی بسازید',subUp:'برای چت‌ها و سابقه مطالعه یک حساب خصوصی بسازید.',in:'ورود',up:'ساخت حساب',email:'آدرس ایمیل',password:'رمز عبور',show:'نمایش',hide:'پنهان',working:'لطفاً صبر کنید…',needConfig:'ورود ابری هنوز تنظیم نشده است. مالک باید Supabase را متصل کند.',created:'حساب ساخته شد. اگر تأیید ایمیل فعال است، ایمیل خود را بررسی کنید.'},
 tr:{welcome:'Hoş geldiniz',titleIn:'Devam etmek için giriş yapın',subIn:'Özel çalışma alanınızı açmak için e-posta ve şifrenizi kullanın.',titleUp:'Öğrenci hesabınızı oluşturun',subUp:'Özel sohbetleriniz ve çalışma geçmişiniz için bir hesap oluşturun.',in:'Giriş yap',up:'Hesap oluştur',email:'E-posta adresi',password:'Şifre',show:'Göster',hide:'Gizle',working:'Lütfen bekleyin…',needConfig:'Bulut girişi henüz yapılandırılmadı. Yönetici önce Supabase bağlantısını tamamlamalıdır.',created:'Hesap oluşturuldu. E-posta onayı açıksa gelen kutunuzu kontrol edin.'},
 ar:{welcome:'مرحباً',titleIn:'سجّل الدخول للمتابعة',subIn:'استخدم بريدك وكلمة المرور لفتح مساحة الدراسة الخاصة بك.',titleUp:'أنشئ حساب الطالب',subUp:'أنشئ حساباً لمحادثاتك وسجل دراستك الخاص.',in:'تسجيل الدخول',up:'إنشاء حساب',email:'البريد الإلكتروني',password:'كلمة المرور',show:'إظهار',hide:'إخفاء',working:'يرجى الانتظار…',needConfig:'تسجيل الدخول السحابي غير مُعد بعد. يجب على المالك ربط Supabase أولاً.',created:'تم إنشاء الحساب. افحص بريدك إذا كان تأكيد البريد مفعلاً.'},
 zh:{welcome:'欢迎',titleIn:'登录后继续',subIn:'使用邮箱和密码进入你的私人学习空间。',titleUp:'创建学生账户',subUp:'为私人聊天和学习记录创建一个账户。',in:'登录',up:'创建账户',email:'电子邮箱',password:'密码',show:'显示',hide:'隐藏',working:'请稍候…',needConfig:'云端登录尚未配置。管理员需要先连接 Supabase。',created:'账户已创建。如果启用了邮箱验证，请检查邮箱。'}
};
function lang(){return localStorage.getItem('smd-ui-lang')||'en';}
function t(){return TEXT[lang()]||TEXT.en;}
function applyLanguage(code){localStorage.setItem('smd-ui-lang',code);document.documentElement.lang=code;document.documentElement.dir=RTL.has(code)?'rtl':'ltr';$('#loginLanguage').value=code;renderMode();}
function renderMode(){const x=t();$('#authTitle').textContent=mode==='signin'?x.titleIn:x.titleUp;$('#authSubtitle').textContent=mode==='signin'?x.subIn:x.subUp;$('#emailLabel').textContent=x.email;$('#passwordLabel').textContent=x.password;$('#signInTab').textContent=x.in;$('#signUpTab').textContent=x.up;$('#authSubmit').textContent=mode==='signin'?x.in:x.up;$('#signupOptions').classList.toggle('hidden',mode!=='signup');$('#signInTab').classList.toggle('active',mode==='signin');$('#signUpTab').classList.toggle('active',mode==='signup');$('#loginPassword').autocomplete=mode==='signin'?'current-password':'new-password';}
function setMode(next){mode=next;$('#authMessage').textContent='';$('#authMessage').className='auth-message';renderMode();}
function showMessage(msg,type='info'){$('#authMessage').textContent=msg;$('#authMessage').className=`auth-message ${type}`;}
async function init(){
 $('#year').textContent=new Date().getFullYear();applyLanguage(lang());
 $('#loginLanguage').addEventListener('change',e=>applyLanguage(e.target.value));
 $('#signInTab').onclick=()=>setMode('signin');$('#signUpTab').onclick=()=>setMode('signup');
 $('#togglePassword').onclick=()=>{const input=$('#loginPassword'),show=input.type==='password';input.type=show?'text':'password';$('#togglePassword').textContent=show?t().hide:t().show;};
 if(CONFIG.supabaseUrl&&CONFIG.supabaseAnonKey){try{const s=await currentSession();if(s){location.replace('./app.html');return;}}catch{}}
 $('#loginForm').addEventListener('submit',submit);
 if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey)showMessage(t().needConfig,'warning');
}
async function submit(e){e.preventDefault();const x=t();if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey){showMessage(x.needConfig,'warning');return;}const btn=$('#authSubmit');btn.disabled=true;btn.textContent=x.working;showMessage('');try{const email=$('#loginEmail').value.trim(),password=$('#loginPassword').value;if(mode==='signin'){const d=await signIn(email,password);if(d?.session)location.replace('./app.html');else showMessage('Sign in could not be completed.','error');}else{const d=await signUp(email,password,{privacyAccepted:$('#privacyAccept').checked,ownerReview:$('#ownerReviewOptIn').checked});if(d?.session)location.replace('./app.html');else showMessage(x.created,'success');}}catch(err){showMessage(err.message||'Something went wrong.','error');}finally{btn.disabled=false;renderMode();}}
init();
