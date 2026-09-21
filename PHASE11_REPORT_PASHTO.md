# Suhail Medical Dictionary v21.10.0 — Phase 11 راپور

## Phase 11 — Full Multilingual UI & RTL Expansion

په دې checkpoint کې shared interface د اوو ژبو لپاره بشپړ شو:

- English
- پښتو (Pashto)
- دری (Dari)
- فارسی (Persian)
- العربية (Arabic)
- Türkçe (Turkish)
- 中文 (Chinese)

## مهم بدلونونه

- نوی modular `assets/js/i18n.js` runtime جوړ شو.
- Language preference په `localStorage` کې ساتل کېږي او د ټولو shared pages ترمنځ یو شان تطبیقېږي.
- Pashto، Dari، Persian او Arabic ته `dir="rtl"` کارېږي؛ English، Turkish او Chinese LTR دي.
- Desktop RTL کې Sidebar ښي اړخ ته ځي، Topbar/Main content mirror کېږي او Term detail drawer چپ اړخ ته خلاصیږي.
- Mobile RTL drawer direction هم سم mirror شوی.
- Login، Dictionary، Anatomy، AI Study، Offline Packs، Settings، About، Privacy/Terms، Admin او Auth callback ټول shared i18n runtime کاروي.
- پخوانی `fa` preference چې په v21 کې د Dari لپاره استعمالېده، یو ځل `prs` ته migrate کېږي؛ `fa` اوس جلا Persian انتخاب دی.
- Cloud preference sync ټول اووه language codes مني.
- i18n runtime د Core Offline Shell برخه ده، نو UI translation د انټرنېټ پرته هم کار کوي.

## د طبي محتوا صداقت

UI ژباړل شوی، خو د medical corpus لپاره جعلي ژباړې نه دي جوړې شوې. موجود dataset یوازې English او موجود draft Pashto/Persian-script fields لري. Arabic/Turkish/Chinese کې که د term definition ژباړه موجوده نه وي، English medical content ښودل کېږي. Anatomy structure names هم English + Latin پاتې کېږي. دا قصداً دی څو ناسم طبي ترجمه د verified content په توګه وړاندې نه شي.

## QA

- `verify_phase1.py` تر `verify_phase11.py` پورې regression tests باید PASS وي.
- JS syntax، JSON parse، CSS balance، duplicate IDs او local-file reference audit شامل دي.
- Core Offline Shell کې `i18n.js` pre-cache کېږي.
- Live unrestricted Chrome/Edge/Safari/iPhone QA بیا هم په عادي device/browser کې وروستی external test دی که container Chromium کار ونه کړي.

## وروستی verification

- Phase 1 → Phase 11 regression verifiers: **PASS**
- Core Offline Shell: **36 files / 828,680 bytes**
- Dictionary pack: **14 files / 1,124,954 bytes**
- Anatomy pack: **14 files / 438,151 bytes**
- Local AI Study pack: **6 files / 859,051 bytes**
- Fresh local HTTP smoke: **72 / 72 URLs = 200 OK**
- JavaScript syntax / JSON parse / CSS balance / duplicate IDs / local references: **PASS**
- Chromium headless probe: container DBus/runtime timeout, `DOM=0`; therefore no live-browser PASS is claimed.
