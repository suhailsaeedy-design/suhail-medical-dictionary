# Suhail Medical Dictionary v21 — Phase 6 راپور

## نتیجه
Phase 6 د Phase 5 clean checkpoint باندې جوړ شوی او **Personal Workspace + About + Settings** بشپړوي. Phase 1–5 functionality ساتل شوې او زاړه v16–v20 presentation/runtime layers نه دي بېرته ورګډ شوي.

## بشپړ شوي کارونه
- `Selected Terms` د Dictionary څلورم persistent mode شو؛ د term card او detail دواړو څخه Add/Remove کېږي.
- Selected Terms په `smd21_selected` کې محلي ذخیره کېږي او د browser reload وروسته پاتې کېږي.
- Selected workspace څخه تر 8 اصطلاحاتو پورې مستقیم AI Study context ته انتقالېدای شي.
- `about.html` او `settings.html` د shared Sidebar/Topbar دننه مستقل pages شول.
- Dictionary، Anatomy، AI Study او Offline Packs څخه زاړه تکراري About/Settings modals لرې شول.
- Settings: Dark/Light، English/Pashto/Dari، Text size، Reduced motion، Dictionary 1/2/3 columns.
- Settings د Selected/Bookmarks/History/AI chats حقیقي local counts ښيي او جلا clear controls لري.
- Reset Preferences شخصي study data نه پاکوي؛ یوازې UI preferences default ته ګرځوي.
- About page د v21 clean architecture، bundled scope، creator `Suhail Saeedy`، privacy/local-data behavior او medical limitations واضح کوي.
- About/Settings CSS/JS او pages د Core Offline Shell برخه شول.
- Global search په About/Settings کې Enter سره Dictionary ته query handoff کوي.

## Medical / privacy حدود
دا educational reference دی؛ diagnosis، treatment، emergency care یا medication prescribing replacement نه دی. Bookmarks، Selected، History، UI preferences او local AI chats په browser کې محلي ساتل کېږي.

## QA
`verify_phase1.py` تر `verify_phase6.py` پورې ټول باید PASS شي. Phase 6 verifier Selected runtime، multi-term AI handoff، Settings data controls، About truthfulness، shared shell، offline core، duplicate IDs، local refs، JSON/JS syntax او GitHub workflow hook ګوري.

## وروستي verification results
- Phase 1 regression: **PASS** — 1,158 terms / 17 categories
- Phase 2 regression: **PASS** — 206 bones / 50 muscles
- Phase 3 regression: **PASS** — Explain / Compare / Quiz / Flashcards / Summary
- Phase 4 regression: **PASS** — 185 Conditions / 135 Procedures / 87 Pharmacology / 7 calculators
- Phase 5 regression: **PASS** — 3 optional Offline Packs + Core Shell
- Phase 6 verifier: **PASS** — Selected Terms + dedicated About/Settings + local preference/data controls
- Core Offline Shell: **31 files**
- Fresh local HTTP smoke: **50/50 unique URLs = 200 OK**
- CSS delimiter sanity: **PASS**
- JSON/webmanifest parse: **PASS**
- Python verifier compile: **PASS**
- JavaScript + Service Worker syntax: **PASS**
- Chromium live-browser attempt: **PASS نه دی اعلان شوی**. Headless Chromium د container DBus/runtime ستونزې له امله timeout شو او DOM یې ورنه کړ.
