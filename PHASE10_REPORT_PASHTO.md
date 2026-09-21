# Suhail Medical Dictionary v21.9.0 — Phase 10 راپور

## Phase 10 — Secure Owner / Admin Console

دا Phase د public learner workspace څخه جلا Owner/Admin maintenance route جوړوي. Admin URL پټول security نه ګڼل کېږي؛ حقیقي optional cloud privilege د Supabase verified session، server-managed `app_metadata` role او database enforcement پر بنسټ دی.

## Local diagnostics
- `admin-login.html` جلا entry route دی؛ public Sidebar کې Admin button نشته.
- `admin.html` د bundled Dictionary، Clinical Reference، Anatomy، PWA/Offline او configuration health لوستل کوي.
- Dictionary terms/categories، Clinical Reference total، Anatomy structure total او د active account خپل Selected/AI chat counts ښيي.
- Duplicate term IDs، curated related-reference integrity، Service Worker status، Cache Storage pack completeness او critical same-origin files چک کوي.
- د English/Pashto/Dari/Arabic/Turkish/Chinese definition coverage report ښکاره کوي، خو draft translations medically reviewed نه بولي.
- Diagnostics په local JSON report کې export کېدای شي.

## Privacy boundary
- Local Admin diagnostics د نورو accountونو localStorage نه لولي.
- Cloud Admin raw `user_app_state.state` یا د نورو users email addresses نه ښيي.
- Static GitHub Pages ته جعلي secure CRUD/file-write functionality نه ده اضافه شوې.
- Admin pages/assets Core Offline Shell ته نه دي cache شوي.

## Optional cloud admin
- `data/admin-config.json` کې cloud admin default **disabled** دی.
- Allowed server-managed roles: `owner`, `admin`.
- Authorization claim: `app_metadata.smd_role`; `user_metadata` د authorization لپاره نه کارول کېږي.
- `supabase/phase10_admin_metrics.sql` aggregate-only metrics جوړوي: synced profile count، 24h/7d activity counts، last sync time او approximate state bytes.
- Security-definer implementation په non-exposed `private` schema کې دی، explicit role check لري؛ public RPC wrapper security-invoker دی او یوازې `authenticated` ته execute ورکوي.
- Browser project کې `service_role`/secret/database password نه شته.

## QA
- Phase 1–10 regression verifiers باید ټول PASS وي.
- JavaScript syntax، JSON/Webmanifest parse، CSS brace check، duplicate-ID/local-reference audit او GitHub workflow parse شامل دي.
- Live browser automation که د execution environment له DBus/runtime محدودیت سره block وي، browser PASS نه ادعا کېږي.

## Login return hardening
که user مستقیم Admin access route ته راشي او account/consent لا نه وي بشپړ، Login اوس یوازې له محدود safe local destination list څخه return target مني. Raw/external `return=` URL ته مستقیم redirect نه کېږي.

## Final available-environment QA
- Phase 1–10 verifiers: **PASS**.
- Fresh HTTP smoke: Admin pages/assets + Supabase Phase 10 setup + Core/Offline Pack URLs ټول **72/72 = 200 OK**.
- Main/Admin HTML external required script/style runtime references: **0**.
- Browser secret pattern scan: **PASS**.
- Admin safe defaults (`cloudAdmin.enabled=false`, raw cross-user state/email display disabled): **PASS**.
- Chromium headless basic `data:` probe: د container د DBus/runtime ستونزې له امله 10s timeout، `DOM=0`; نو live-browser PASS نه دی اعلان شوی.
