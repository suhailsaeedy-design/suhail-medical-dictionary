(() => {
  'use strict';

  const STORAGE = Object.freeze({
    languageMigration: 'smd21_lang_v11_migrated',
    language: 'smd21_lang',
    theme: 'smd21_theme',
    motion: 'smd21_motion',
    fontScale: 'smd21_font_scale',
  });

  const VALID_LANGUAGES = Object.freeze(['en', 'ps', 'prs', 'fa', 'ar', 'tr', 'zh']);
  const RTL_LANGUAGES = new Set(['ps', 'prs', 'fa', 'ar']);

  const HTML_LANGUAGE = Object.freeze({
    en: 'en',
    ps: 'ps',
    prs: 'fa-AF',
    fa: 'fa',
    ar: 'ar',
    tr: 'tr',
    zh: 'zh-CN',
  });

  const LABELS = Object.freeze({
    en: {
      dictionary: 'Dictionary',
      selected: 'Selected',
      bookmarks: 'Bookmarks',
      history: 'History',
      anatomy: '3D Anatomy',
      aiStudy: 'AI Study',
      offlinePacks: 'Offline Packs',
      settings: 'Settings',
      about: 'About',
      search: 'Search medical terms, conditions, anatomy, or concepts…',
    },
    ps: {
      dictionary: 'قاموس',
      selected: 'ټاکل شوي',
      bookmarks: 'نښې',
      history: 'تاریخچه',
      anatomy: 'درې بعدي اناتومي',
      aiStudy: 'AI مطالعه',
      offlinePacks: 'آفلاین بستې',
      settings: 'تنظیمات',
      about: 'زموږ په اړه',
      search: 'طبي اصطلاحات، ناروغۍ، اناتومي یا مفاهیم ولټوئ…',
    },
    prs: {
      dictionary: 'فرهنگ پزشکی',
      selected: 'انتخاب‌شده',
      bookmarks: 'نشانک‌ها',
      history: 'تاریخچه',
      anatomy: 'آناتومی سه‌بعدی',
      aiStudy: 'مطالعه هوش مصنوعی',
      offlinePacks: 'بسته‌های آفلاین',
      settings: 'تنظیمات',
      about: 'درباره',
      search: 'اصطلاحات پزشکی، بیماری‌ها، آناتومی یا مفاهیم را جستجو کنید…',
    },
    fa: {
      dictionary: 'فرهنگ پزشکی',
      selected: 'انتخاب‌شده',
      bookmarks: 'نشانک‌ها',
      history: 'تاریخچه',
      anatomy: 'آناتومی سه‌بعدی',
      aiStudy: 'مطالعه هوش مصنوعی',
      offlinePacks: 'بسته‌های آفلاین',
      settings: 'تنظیمات',
      about: 'درباره',
      search: 'اصطلاحات پزشکی، بیماری‌ها، آناتومی یا مفاهیم را جستجو کنید…',
    },
    ar: {
      dictionary: 'القاموس الطبي',
      selected: 'المحدد',
      bookmarks: 'الإشارات المرجعية',
      history: 'السجل',
      anatomy: 'التشريح ثلاثي الأبعاد',
      aiStudy: 'دراسة بالذكاء الاصطناعي',
      offlinePacks: 'حزم دون اتصال',
      settings: 'الإعدادات',
      about: 'حول',
      search: 'ابحث عن المصطلحات الطبية أو الحالات أو التشريح أو المفاهيم…',
    },
    tr: {
      dictionary: 'Tıbbi Sözlük',
      selected: 'Seçilenler',
      bookmarks: 'Yer İmleri',
      history: 'Geçmiş',
      anatomy: '3B Anatomi',
      aiStudy: 'AI Çalışma',
      offlinePacks: 'Çevrimdışı Paketler',
      settings: 'Ayarlar',
      about: 'Hakkında',
      search: 'Tıbbi terim, durum, anatomi veya kavram ara…',
    },
    zh: {
      dictionary: '医学词典',
      selected: '已选择',
      bookmarks: '书签',
      history: '历史记录',
      anatomy: '3D 解剖',
      aiStudy: 'AI 学习',
      offlinePacks: '离线包',
      settings: '设置',
      about: '关于',
      search: '搜索医学术语、疾病、解剖或概念…',
    },
  });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function migrateLegacyLanguagePreference() {
    if (localStorage.getItem(STORAGE.languageMigration)) return;

    if (localStorage.getItem(STORAGE.language) === 'fa') {
      localStorage.setItem(STORAGE.language, 'prs');
    }

    localStorage.setItem(STORAGE.languageMigration, '1');
  }

  migrateLegacyLanguagePreference();

  const storedLanguage = localStorage.getItem(STORAGE.language);

  const state = {
    theme: localStorage.getItem(STORAGE.theme) || 'dark',
    lang: VALID_LANGUAGES.includes(storedLanguage) ? storedLanguage : 'en',
    motion: localStorage.getItem(STORAGE.motion) || 'auto',
    fontScale: clamp(Number(localStorage.getItem(STORAGE.fontScale) || 100), 90, 125),
  };

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;

    document.querySelectorAll('[data-theme-select]').forEach((control) => {
      control.value = state.theme;
    });
  }

  function applyLanguage() {
    const labels = LABELS[state.lang] || LABELS.en;

    document.documentElement.lang = HTML_LANGUAGE[state.lang] || 'en';
    document.documentElement.dir = RTL_LANGUAGES.has(state.lang) ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-lang-select]').forEach((control) => {
      control.value = state.lang;
    });

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (labels[key]) element.textContent = labels[key];
    });

    document.querySelectorAll('[data-search-placeholder]').forEach((element) => {
      element.placeholder = labels.search;
    });
  }

  function applyAccessibility() {
    document.documentElement.dataset.motion = state.motion;
    document.documentElement.style.fontSize = `${state.fontScale}%`;

    document.querySelectorAll('[data-motion-select]').forEach((control) => {
      control.value = state.motion;
    });

    document.querySelectorAll('[data-font-scale]').forEach((control) => {
      control.value = String(state.fontScale);
    });
  }

  function setTheme(value) {
    state.theme = ['dark', 'light'].includes(value) ? value : 'dark';
    localStorage.setItem(STORAGE.theme, state.theme);
    applyTheme();
  }

  function setLanguage(value) {
    state.lang = VALID_LANGUAGES.includes(value) ? value : 'en';
    localStorage.setItem(STORAGE.language, state.lang);
    applyLanguage();

    window.dispatchEvent(
      new CustomEvent('smd21:languagechange', {
        detail: { lang: state.lang },
      }),
    );
  }

  function setMotion(value) {
    state.motion = ['auto', 'reduce'].includes(value) ? value : 'auto';
    localStorage.setItem(STORAGE.motion, state.motion);
    applyAccessibility();
  }

  function setFontScale(value) {
    state.fontScale = clamp(Number(value) || 100, 90, 125);
    localStorage.setItem(STORAGE.fontScale, String(state.fontScale));
    applyAccessibility();
  }

  function handlePreferenceChange(event) {
    const control = event.target;

    if (control.matches('[data-theme-select]')) setTheme(control.value);
    if (control.matches('[data-lang-select]')) setLanguage(control.value);
    if (control.matches('[data-motion-select]')) setMotion(control.value);
    if (control.matches('[data-font-scale]')) setFontScale(control.value);
  }

  function applyAllPreferences() {
    applyTheme();
    applyLanguage();
    applyAccessibility();
  }

  document.addEventListener('change', handlePreferenceChange);
  document.addEventListener('DOMContentLoaded', applyAllPreferences);

  // Apply immediately for pages whose controls are already present.
  applyAllPreferences();

  window.SMD21 = {
    state,
    labels: LABELS,
    validLangs: VALID_LANGUAGES,
    rtlLangs: RTL_LANGUAGES,
    setTheme,
    setLang: setLanguage,
    setMotion,
    setFontScale,
  };
})();
