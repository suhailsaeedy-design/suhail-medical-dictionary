# Suhail Medical Dictionary v21.17.0 — Post-Release Cloud Activation Readiness

## نتیجه
Cloud/Deployment readiness layer بشپړ شو. Core app لا هم local/offline-first دی او distributed config کې هېڅ حقیقي secret یا project credential نشته.

## نوي کارونه
- Settings کې `Cloud activation readiness` diagnostic card.
- Exact deployed `auth-callback.html` URL ښکاره/copy کېږي.
- Public auth config safety validation.
- Supabase Auth `/auth/v1/settings` connectivity check.
- Google provider enabled/disabled status check.
- Sync table/config readiness status.
- Source-only `deployment/auth-config.example.json` template.
- Pashto cloud activation/deployment guide.
- Service-role/secret key browser rejection guards.
- Cloud readiness runtime د Core Offline Shell برخه ده.

## Security boundary
Browser ته یوازې Supabase publishable key مناسب دی. Service-role/secret key، database password او Google client secret باید Supabase/secure server side کې پاتې شي.

## مهم limitation
دا package ستا حقیقي Supabase project URL/key یا Google OAuth credentials نه لري، نو حقیقي cloud sign-in تر owner configuration وروسته فعالېږي.
