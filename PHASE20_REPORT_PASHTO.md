# Suhail Medical Dictionary v21.19.0 — Phase 20 Pre‑Production Cleanup

## پایله
**PASS** — د Publish مخکې database/source consistency او security cleanup بشپړ شو.

## Live Supabase cleanup
- زاړه v20 application tables لرې شول: `profiles`, `chats`, `ai_messages`, `user_events`, `ai_usage_daily`, `term_translation_cache`.
- زاړه Auth profile trigger او unused privileged RPCs لرې شول.
- `auth.users` او Google identities قصداً ساتل شوي.
- `public` schema کې اوس یوازې `user_app_state` پاتې دی.
- `user_app_state` RLS فعال دی؛ هر authenticated user یوازې خپل row لیدلی/بدلولی شي.
- `anon` ته هېڅ table privilege نشته.
- `authenticated` ته یوازې `SELECT / INSERT / UPDATE / DELETE` شته.
- Supabase performance advisor: **0 findings**.
- Security advisor کې د legacy SECURITY DEFINER warnings ختم شول.
- پاتې warning یوازې leaked-password protection دی؛ current v21 login Google OAuth دی، password login نه کاروي.

## Admin security
- Public `smd_admin_metrics()` SECURITY INVOKER دی.
- Privileged implementation په `private` schema کې دی او `app_metadata.smd_role` چک کوي.
- Aggregate metric key اوس `synced_accounts` دی؛ raw user state/email نه راګرځوي.
- Cloud Admin browser feature لا disabled دی تر څو owner/admin identity په قصد server-side وټاکل شي.

## Source consistency
- Canonical `phase20_preproduction_cleanup.sql` اوس idempotent/current-state دی او dropped legacy tables بېرته نه جوړوي.
- Live Google/Supabase sync فعال دی.
- Cloud AI جلا feature دی او لا هم disabled/blank دی.
- Browser config یوازې publishable key لري؛ service-role/secret key نه لري.

## Release metadata
- Version: `21.19.0`
- Service Worker: `smd-v21-phase20`
- Offline pack prefix: `smd-v21-phase20-pack-`

## وروستی QA
- Phase 1–20 regressions: **PASS**.
- Clean production build: **PASS**.
- Production HTTP smoke: **88/88 = 200 OK**.
- Legacy privileged RPC warnings: **removed**.
- Supabase performance advisor: only two unused-index INFO notices remain; no RLS init-plan warnings.
- Supabase security advisor: only leaked-password-protection warning remains; v21 public sign-in is Google-based.

## وروستی QA
- Phase 1–20 regression: PASS.
- Production build: 86 runtime files / 2,446,738 bytes (release-manifest څخه مخکې runtime payload).
- Live-like local HTTP smoke: 88/88 URLs = 200 OK.
- Production release-manifest integrity: PASS.
- Deterministic build: PASS.
- Supabase public schema: only `user_app_state`.
- Supabase performance advisor: 0 findings.
