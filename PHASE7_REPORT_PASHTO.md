# Suhail Medical Dictionary v21 — Phase 7 راپور

## نتیجه
Phase 7 د Phase 6 clean checkpoint څخه جوړ شوی او **Authentication + Optional Cloud Sync** clean architecture اضافه کوي. Core local/offline workflow لا هم Supabase، paid API یا cloud database ته اجباري اړتیا نه لري.

## بشپړ شوي کارونه
- Local Selected / Bookmarks / History اوس د هر account لپاره جلا scoped keys لري؛ پخواني global keys د فعال account لپاره یو ځل migrate کېږي.
- Google sign-in لپاره optional Supabase Auth flow اضافه شو. Default `data/auth-config.json` disabled او blank دی.
- `auth-callback.html` د returned access token له Supabase `/auth/v1/user` سره verify کوي، بیا account ID/email ثبتوي.
- Cloud access/refresh tokens یوازې `sessionStorage` کې ساتل کېږي، نه persistent localStorage کې.
- Settings کې Connect Google، Pull & merge، Push snapshot او Disconnect cloud controls اضافه شول؛ کله چې config بند وي controls disabled وي.
- Optional sync د Selected Terms، Bookmarks، History، AI Study chats او UI preferences snapshot sync کوي.
- `supabase/phase7_user_app_state.sql` د `user_app_state` table + RLS policies جوړوي. هر policy د authenticated user لپاره `(select auth.uid()) = user_id` ownership شرط لري.
- `anon` ته table access revoke شوی؛ browser project کې service-role/secret key نه شته.
- Privacy/Terms/About wording د optional cloud behavior سره update شو.
- Normal Sign out د active cloud session revoke هڅه کوي او local active account/session پاکوي؛ د account-scoped study data په قصدي ډول نه delete کوي.

## مهم limitation
Default checkpoint کې حقیقي Supabase project URL، publishable key او Google provider credentials نشته، نو external Google OAuth/live Supabase request **PASS نه دی ادعا شوی**. Integration architecture current Supabase Auth/Data REST flow ته جوړه شوې؛ د حقیقي cloud QA لپاره owner باید خپل Supabase project configure کړي.

## QA هدف
`verify_phase1.py` تر `verify_phase7.py` پورې باید ټول PASS شي. Phase 7 verifier account isolation/migration، blank/default cloud config، secret scan، callback/config/runtime wiring، RLS SQL، offline-core references، JS/JSON/YAML parse او GitHub workflow hook ګوري.

## وروستي verification results
- Phase 1 regression: **PASS** — 1,158 terms / 17 categories
- Phase 2 regression: **PASS** — 206 bones / 50 muscles
- Phase 3 regression: **PASS** — Explain / Compare / Quiz / Flashcards / Summary
- Phase 4 regression: **PASS** — 185 Conditions / 135 Procedures / 87 Pharmacology / 7 calculators
- Phase 5 regression: **PASS** — Core Shell + 3 optional Offline Packs
- Phase 6 regression: **PASS** — Selected Terms + About/Settings
- Phase 7 verifier: **PASS** — account isolation/migration + optional Google/Supabase sync architecture + RLS/security checks
- Phase 7 Node runtime smoke: **PASS** — legacy migration, two-account isolation, local+remote merge, synced preference application
- JavaScript + Service Worker syntax: **PASS**
- JSON parse: **PASS**
- Python verifier compile: **PASS**
- Fresh local HTTP smoke: **53/53 unique URLs = 200 OK**
- Core Offline Shell: **35 files**
- Chromium live-browser attempt: **PASS نه دی اعلان شوی**؛ container DBus/runtime errors له امله 12-second timeout او 0-byte DOM راغی.
- External Google/Supabase live auth: **نه دی ازمویل شوی** ځکه default checkpoint کې project URL/key/provider credentials په قصد blank/disabled دي.
