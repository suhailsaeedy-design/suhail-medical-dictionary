# Suhail Medical Dictionary v21.7.0 — Phase 8 راپور

## Phase 8 — Term Detail & Export Tools

دا Phase د Dictionary هغه پاتې productivity controls بشپړوي چې په approved scope کې غوښتل شوي وو، او user-facing UI څخه داخلي development Phase labels هم پاکوي.

## بشپړ شوي کارونه
- د Dictionary `Search` button اوس حقیقي handler لري.
- `Advanced Filters` functional modal دی: Has synonyms، Clinical Reference linked، Has related terms، او A–Z / Z–A / Category sorting.
- `Select filtered` یوازې اوسنی filtered result set Selected Terms ته اضافه کوي.
- Selected Terms په local CSV فایل export کېږي.
- Term Detail کې MeSH ID او curated Related Terms ښکاري.
- Pronounce د browser Speech Synthesis کاروي.
- AI Study button ټاکل شوی term د context په توګه `ai.html` ته لېږي.
- PDF button dependency-free local PDF فایل جوړ او download کوي.
- Print button د current localized term لپاره printable document جوړوي.
- Copy summary button د term summary clipboard ته کاپي کوي.
- Offline Pack button د Dictionary offline pack card ته ځي؛ Offline Packs page د pack hash په اساس اړوند card highlight/scroll کوي.
- `?term=<id>` deep-link support اضافه شو.
- user-facing Sidebar/hero څخه `Phase X` development labels لرې شول.

## PDF / Print دقت
- Direct PDF export canonical English reference text کاروي څو built-in PDF Helvetica font سره dependency-free compatibility وساتل شي.
- Browser Print د اوسني displayed/localized text څخه print document جوړوي.
- PDF generation هېڅ external API، CDN، paid conversion service یا remote library ته اړتیا نه لري.

## Safety
- دا educational medical reference دی، diagnosis/treatment replacement نه دی.
- PDF/Print export هماغه bundled educational content export کوي؛ medication dosing یا treatment instructions نه جوړوي.

## وروستی QA
- Phase 1 verifier: **PASS** — 1,158 terms / 17 categories.
- Phase 2 verifier: **PASS** — 206 bones / 50 muscles.
- Phase 3 verifier: **PASS** — Local Study Engine.
- Phase 4 verifier: **PASS** — 185 Conditions / 135 Procedures / 87 Pharmacology / 7 calculators.
- Phase 5 verifier: **PASS** — Core Offline Shell + 3 optional packs.
- Phase 6 verifier: **PASS** — Selected Terms + About/Settings.
- Phase 7 verifier: **PASS** — account isolation + optional cloud sync architecture.
- Phase 8 verifier: **PASS** — Advanced Filters + bulk selection + MeSH/Related/Pronounce/AI/PDF/Print/Copy/Offline actions.
- Direct PDF runtime structure test: **PASS** (`%PDF-1.4`, page object, xref, trailer, EOF).
- `pdfinfo` parse: **PASS** — valid PDF 1.4, 1 page, unencrypted.
- JS syntax / JSON parse / CSS brace sanity / duplicate-ID / local-reference audit: **PASS**.
- Fresh local HTTP smoke: **57/57 URLs = 200 OK**.
- Dictionary offline pack: **14 files / 1,124,288 bytes**.
- Anatomy offline pack: **6 files / 244,976 bytes**.
- Local AI Study offline pack: **6 files / 856,678 bytes**.
- Core Offline Shell: **35 files / 734,117 bytes**.

## Browser limitation
Automated Chromium probe حتی په ساده `data:` page کې د container د DBus/runtime ستونزې له امله 12 ثانیو کې timeout شو او DOM output یې ورنه کړ. له همدې امله **live-browser PASS نه دی ادعا شوی**. Static/runtime-source/PDF/HTTP checks ټول clean دي، خو وروستی unrestricted Chrome/Edge/Safari/iPhone interaction test باید په عادي device/browser کې وشي.
