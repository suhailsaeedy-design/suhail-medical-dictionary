(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const MIGRATION='smd21_lang_v11_migrated';
  if(!localStorage.getItem(MIGRATION)){
    if(localStorage.getItem('smd21_lang')==='fa')localStorage.setItem('smd21_lang','prs');
    localStorage.setItem(MIGRATION,'1');
  }
  const validLangs=['en','ps','prs','fa','ar','tr','zh'];
  const rtlLangs=new Set(['ps','prs','fa','ar']);
  const htmlLang={en:'en',ps:'ps',prs:'fa-AF',fa:'fa',ar:'ar',tr:'tr',zh:'zh-CN'};
  const state = {
    theme: localStorage.getItem('smd21_theme') || 'dark',
    lang: validLangs.includes(localStorage.getItem('smd21_lang'))?localStorage.getItem('smd21_lang'):'en',
    motion: localStorage.getItem('smd21_motion') || 'auto',
    fontScale: clamp(Number(localStorage.getItem('smd21_font_scale')||100),90,125)
  };
  const labels = {
    en:{dictionary:'Dictionary',selected:'Selected',bookmarks:'Bookmarks',history:'History',anatomy:'3D Anatomy',aiStudy:'AI Study',offlinePacks:'Offline Packs',settings:'Settings',about:'About',search:'Search medical terms, conditions, anatomy, or concepts…'},
    ps:{dictionary:'قاموس',selected:'ټاکل شوي',bookmarks:'نښې',history:'تاریخچه',anatomy:'درې بعدي اناتومي',aiStudy:'AI مطالعه',offlinePacks:'آفلاین بستې',settings:'تنظیمات',about:'زموږ په اړه',search:'طبي اصطلاحات، ناروغۍ، اناتومي یا مفاهیم ولټوئ…'},
    prs:{dictionary:'فرهنگ پزشکی',selected:'انتخاب‌شده',bookmarks:'نشانک‌ها',history:'تاریخچه',anatomy:'آناتومی سه‌بعدی',aiStudy:'مطالعه هوش مصنوعی',offlinePacks:'بسته‌های آفلاین',settings:'تنظیمات',about:'درباره',search:'اصطلاحات پزشکی، بیماری‌ها، آناتومی یا مفاهیم را جستجو کنید…'},
    fa:{dictionary:'فرهنگ پزشکی',selected:'انتخاب‌شده',bookmarks:'نشانک‌ها',history:'تاریخچه',anatomy:'آناتومی سه‌بعدی',aiStudy:'مطالعه هوش مصنوعی',offlinePacks:'بسته‌های آفلاین',settings:'تنظیمات',about:'درباره',search:'اصطلاحات پزشکی، بیماری‌ها، آناتومی یا مفاهیم را جستجو کنید…'},
    ar:{dictionary:'القاموس الطبي',selected:'المحدد',bookmarks:'الإشارات المرجعية',history:'السجل',anatomy:'التشريح ثلاثي الأبعاد',aiStudy:'دراسة بالذكاء الاصطناعي',offlinePacks:'حزم دون اتصال',settings:'الإعدادات',about:'حول',search:'ابحث عن المصطلحات الطبية أو الحالات أو التشريح أو المفاهيم…'},
    tr:{dictionary:'Tıbbi Sözlük',selected:'Seçilenler',bookmarks:'Yer İmleri',history:'Geçmiş',anatomy:'3B Anatomi',aiStudy:'AI Çalışma',offlinePacks:'Çevrimdışı Paketler',settings:'Ayarlar',about:'Hakkında',search:'Tıbbi terim, durum, anatomi veya kavram ara…'},
    zh:{dictionary:'医学词典',selected:'已选择',bookmarks:'书签',history:'历史记录',anatomy:'3D 解剖',aiStudy:'AI 学习',offlinePacks:'离线包',settings:'设置',about:'关于',search:'搜索医学术语、疾病、解剖或概念…'}
  };
  function applyTheme(){document.documentElement.dataset.theme=state.theme;document.querySelectorAll('[data-theme-select]').forEach(x=>x.value=state.theme)}
  function applyLang(){
    document.documentElement.lang=htmlLang[state.lang]||'en';document.documentElement.dir=rtlLangs.has(state.lang)?'rtl':'ltr';
    document.querySelectorAll('[data-lang-select]').forEach(x=>x.value=state.lang);
    const l=labels[state.lang]||labels.en;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(l[k])el.textContent=l[k]});
    document.querySelectorAll('[data-search-placeholder]').forEach(el=>el.placeholder=l.search);
  }
  function applyAccessibility(){document.documentElement.dataset.motion=state.motion;document.documentElement.style.fontSize=`${state.fontScale}%`;document.querySelectorAll('[data-motion-select]').forEach(x=>x.value=state.motion);document.querySelectorAll('[data-font-scale]').forEach(x=>x.value=String(state.fontScale))}
  function setTheme(v){state.theme=['dark','light'].includes(v)?v:'dark';localStorage.setItem('smd21_theme',state.theme);applyTheme();}
  function setLang(v){state.lang=validLangs.includes(v)?v:'en';localStorage.setItem('smd21_lang',state.lang);applyLang();window.dispatchEvent(new CustomEvent('smd21:languagechange',{detail:{lang:state.lang}}));}
  function setMotion(v){state.motion=['auto','reduce'].includes(v)?v:'auto';localStorage.setItem('smd21_motion',state.motion);applyAccessibility();}
  function setFontScale(v){state.fontScale=clamp(Number(v)||100,90,125);localStorage.setItem('smd21_font_scale',String(state.fontScale));applyAccessibility();}
  document.addEventListener('change',e=>{if(e.target.matches('[data-theme-select]'))setTheme(e.target.value);if(e.target.matches('[data-lang-select]'))setLang(e.target.value);if(e.target.matches('[data-motion-select]'))setMotion(e.target.value);if(e.target.matches('[data-font-scale]'))setFontScale(e.target.value)});
  document.addEventListener('DOMContentLoaded',()=>{applyTheme();applyLang();applyAccessibility()});
  applyTheme();applyLang();applyAccessibility();
  window.SMD21={state,setTheme,setLang,setMotion,setFontScale,labels,validLangs,rtlLangs};
})();
