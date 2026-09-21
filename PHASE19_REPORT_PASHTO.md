# Phase 19 — Account/PWA/Creator/Cloud Stability

- حقیقي Supabase project د browser-safe publishable key سره فعال شو؛ service-role/secret key frontend ته نه دی داخل شوی.
- `user_app_state` cloud sync د RLS ownership policies سره فعال دی.
- Current Google account او Other Google account flow جلا شول؛ Other account د account chooser غوښتنه کوي.
- Logout د cloud session او local current-account pointer دواړه پاکوي؛ Mobile/Desktop navigation کې ښکاره Sign out شته.
- Full Offline Download persistent storage غوښتنه کوي، درې واړه packs ښکته کوي او Cache Storage verify کوي.
- About page کې د Suhail Saeedi professional creator portrait او developer bio شامل شول.
- Admin/Owner role په تصادفي account نه دی ټاکل شوی؛ دا باید یوازې د creator د تایید شوي Google account لپاره قصدي تنظیم شي.

## Final QA

- Phase 1–19 regressions: PASS (Phase 17–19 جلا بیا PASS شول؛ ګډ اوږد command د Phase 17 پر deterministic build کې د tool timeout حد ته رسېدلی و، نه test failure).
- Production build: 87 listed runtime files / 2,516,101 bytes.
- Production HTTP smoke: 89/89 URLs = HTTP 200 (root + 87 listed files + release manifest).
- GitHub Pages workflow YAML: PASS.
- Supabase live audit: `user_app_state` RLS enabled; SELECT/INSERT/UPDATE/DELETE ownership policies are authenticated-only; anon table grants are absent.
- Supabase security advisor: only leaked-password-protection warning remains; no active RLS/function advisor warning was returned in the final audit.
- Chromium container probe: 12-second timeout, DOM=0, DBus unavailable. No live-browser PASS is claimed from this environment.
