# Suhail Medical Dictionary v21 — Phase 15 راپور

## Phase 15: Responsive Shell & Navigation Finalization

دا مرحله د Mobile/Desktop shared shell هغه وروستۍ navigation نابرابري سموي چې په پخواني v21 build کې پاتې وه.

### Mobile navigation
اوس په اصلي workspace pages کې canonical bottom navigation په ثابت ډول داسې دی:

**Home / Dictionary / 3D Anatomy / AI Study / More**

Bookmarks، History او Selected نور د bottom bar پنځه اصلي ځایونه نه نیسي؛ هغوی د `More` sheet دننه دي. More sheet کې Selected، Bookmarks، History، Offline Packs، Settings، About، Backup/Restore او Sign out شته.

### Home او same-page navigation
`app.html` اوس مستقل `#home` anchor لري. `#dictionary`، `#selected`، `#bookmarks` او `#history` hash changes له reload پرته سم workspace mode بدلوي. Home د Dictionary hero/top ته ځي.

### Desktop account menu
Topbar account chip نور په click مستقیم Sign out نه کوي. اوس accessible account menu پرانیزي چې account identity/provider، Settings، Backup/Restore، About او Sign out جلا actions لري. پخواني page-level direct sign-out listeners د capture-layer له لارې خوندي override کېږي، خو اصلي `SMD21Auth.signOut()` هماغه یو authoritative sign-out method پاتې دی.

### Accessibility / localization
More button `aria-haspopup` او `aria-expanded` لري؛ More sheet د dialog semantics او account menu د menu/menuitem semantics لري. Escape دواړه overlays بندوي. نوي shared labels د 7-language UI لپاره هم اضافه شوي.

### Offline/PWA
`assets/css/shell-navigation.css` او `assets/js/shell-navigation.js` د Core Offline Shell او Service Worker core cache برخه دي، نو canonical navigation آفلاین هم موجود دی.

### Scope limitation
Live Chrome/Edge/Safari/iPhone interaction PASS یوازې هغه وخت ادعا کېدای شي چې حقیقي browser/device test اجرا شي. Static/runtime-source verification د browser د real layout engine بدیل نه ګڼل کېږي.

## وروستی QA
- Phase 1–15 regression: PASS (درانه Phase 13/14 tests جلا هم PASS شول).
- Production build: 82 manifest-tracked runtime files / 2,421,480 bytes.
- Live-like local HTTP smoke: 83/83 deployed files = 200 OK (release-manifest پخپله هم شامل دی).
- Chromium environment probe: 12-second timeout, DOM=0، DBus/zygote runtime errors. له همدې امله live-browser PASS نه ادعا کېږي.
