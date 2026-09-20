# Suhail Medical Dictionary v20.18.1 — Final Completion Repair Report

دا release د v20.18 UI/Anatomy work د بشپړولو او Privacy/Terms bypass د حل لپاره جوړ شوی.

## مهم اصلاحات

- Privacy/Terms consent اوس اجباري gate دی. د consent پرته `app.html`, `anatomy.html`, `ai.html`, او `offline.html` نه خلاصیږي.
- Privacy/Terms page د pending consent پر مهال عادي workspace navigation پټوي او `Back to account setup` ته کار کوي؛ `Back to Dictionary` نور consent نه bypass کوي.
- Local account نور په خپله `privacy_ack_at` نه اخلي او عادي local user `is_owner` نه ګڼل کېږي.
- Login main card کې password field نشته؛ دوه اصلي actions پاتې دي: Current email او Other email.
- Online `Sign in with Other email` د configured Google/Supabase OAuth flow ته ځي او `prompt=select_account` کاروي؛ offline حالت کې local email fallback شته.
- Mobile Login card لوی، centered او touch-friendly شو.
- Mobile sidebar labels، close button او More navigation غښتلي شول.
- Mobile Dictionary hero compact شو او Clinical Reference cards horizontal snap list شول، څو پاڼه غیرضروري اوږده نه شي.
- Mobile AI Study کې message area، quick prompts او sticky composer د اسانه استعمال لپاره سم شول.
- Anatomy کې د بالغ انسان 206 هډوکو catalogue موجود دی؛ هر bone metadata، model، click/tap identify، red highlight، location/overview، Pronounce او Auto Voice لري.
- Male/Female reference controls، Skeleton/Muscles entry screen، Back button او نور anatomy systems ساتل شوي.
- Visible Low/Standard/Ultra selector نشته؛ viewer HD mode کاروي.
- Dashboard/Admin Panel له عادي sidebar څخه لرې دي؛ Admin جلا `admin-login.html` لري.
- PWA Service Worker ته نوي access/consent scripts هم cache شول.
- GitHub Pages workflow د v20.18.1 verifiers د deploy مخکې چلوي.

## QA

- `verify_v20181_final.py` — PASS
- `verify_v2018.py` — PASS
- JavaScript syntax — PASS
- JSON parse — PASS (59 JSON files)
- HTTP smoke — PASS د Login, Dictionary, Anatomy, AI, Offline, Privacy, Terms, Admin او data routes لپاره
- 3D OBJ validation — PASS: 882 OBJ files, 1,108,972 vertices, 2,112,176 faces, empty/missing = 0

## Browser limitation

په دې execution environment کې Chromium localhost navigation د administrator policy له امله `ERR_BLOCKED_BY_ADMINISTRATOR` ورکوي، نو ما جعلي live-browser PASS نه دی ادعا کړی. Source/static/HTTP/geometry checks ټول clean دي. د GitHub deploy وروسته د کارونکي خپل Chrome/Edge/iPhone Safari visual test وروستی device-level QA دی.

## Anatomy accuracy note

206 adult bones د standard adult skeleton count مطابق individually catalogued دي. Current geometry educational/procedural 3D دی، نه د commercial diagnostic/dissection atlas بدیل. د high-fidelity licensed atlas integration لپاره جلا third-party anatomy asset licensing/attribution ته اړتیا وي.
