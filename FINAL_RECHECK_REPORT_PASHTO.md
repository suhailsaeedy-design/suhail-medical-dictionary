# Suhail Medical Dictionary v21.18.0 — Final Recheck

## وروستۍ پایله
- Phase 1–19 regression verifiers: PASS
- Final release verifier: PASS
- Production artifact build: PASS
- Production custom local-reference / duplicate-ID audit: PASS
- Admin runtime files in production artifact: PASS
- Source-only development files excluded from production: PASS
- Supabase user_app_state RLS: verified in live project
- Google/Supabase cloud auth: enabled in browser-safe config
- Cloud Owner/Admin role assignment: intentionally not auto-assigned; no account is guessed as owner.

## Admin Panel
- Entry page: `admin-login.html`
- Console page: `admin.html`
- Local diagnostics are available after normal app sign-in.
- Cloud owner/admin features require an authenticated account whose verified JWT `app_metadata.smd_role` is `owner` or `admin` and cloud admin is enabled.
- The Admin URL is not treated as a security boundary; authorization is role/database enforced.

## Production counts
- Dictionary: 1,158 terms / 17 categories
- Clinical Reference: 185 conditions / 135 procedures-tests / 87 pharmacology concepts / 7 calculators
- Anatomy: 10 systems (206 bones, 50 muscles, plus joints, ligaments, organs, nerves, vessels, teeth, eye, sinuses)
- Production source build: 87 manifest-listed runtime files / 2,516,101 bytes
- Generated production directory: 88 files including `release-manifest.json`

## Browser testing limitation
Automated Chromium is not marked PASS in this environment because the container browser runtime has a DBus/zygote limitation. Static/runtime verifiers and production HTTP checks are separate from real-device Safari/Chrome/Edge testing.
