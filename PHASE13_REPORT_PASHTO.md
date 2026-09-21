# Suhail Medical Dictionary v21 — Phase 13 راپور

## Phase 13 — Backup / Restore & PWA Update Safety

- د فعال account لپاره بشپړ local backup په JSON فایل کې جوړېږي: Selected Terms، Bookmarks، History، AI Study chats او UI preferences.
- Cloud/session tokens، consent record، Supabase keys/secrets او د نورو accountونو local profiles backup ته نه ځي.
- Restore مخکې JSON schema، 5 MB file-size limit، arrays/chats limits او source-account email validate کېږي.
- Restore دوه حالتونه لري: **Merge** او **Replace**. دواړه یوازې اوسني account-scoped keys ته لیکي.
- که backup د بل email وي، explicit confirmation checkbox ضروري دی؛ account په خپله نه بدلېږي.
- Settings کې deployed `version.json` network check، current/latest version status او `Refresh to latest` action شته.
- Service Worker online navigation لپاره network-first شو؛ network fail شي cached page/offline fallback کاروي.
- Phase 13 core runtime (`backup-manager.js`, `update-manager.js`, `version.json`) د Core Offline Shell برخه ده.

## طبي/محرمیت حدود
Backup/restore یوازې study workspace state انتقالوي. دا login token، Google/Supabase session، secret key، consent record یا بل user profile نه انتقالوي. طبي content نه بدلېږي او د diagnosis/treatment feature نه اضافه کېږي.

## Browser QA limitation
Automated Chromium که د execution environment د DBus/zygote له امله DOM تولید نه کړي، live-browser PASS نه اعلانېږي. Static/runtime-source، Node backup tests، HTTP smoke، Service Worker/offline metadata او ZIP integrity جلا ازمویل کېږي.

## وروستی QA
- Phase 1–13 regression verifiers: **PASS**
- Backup runtime build / replace / merge / chat-payload preservation: **PASS**
- Fresh local HTTP smoke: **72/72 = 200 OK**
- HTML local references / duplicate IDs / external runtime scan: **PASS**
- Core Offline Shell: **41 files / 865,965 bytes**
- Automated Chromium live-browser probe: execution environment کې DBus/zygote timeout که DOM=0 وي، browser PASS نه اعلانېږي.
