# Suhail Medical Dictionary v21.18.0 — Phase 19 Live Cloud Sync Activation

## حالت
- Connected Supabase project: **Suhail Medical Dictionary** (`ap-south-1`, ACTIVE_HEALTHY).
- Google provider usage confirmed by existing Google identities in the project.
- Frontend cloud auth is enabled with the browser-safe Supabase publishable key.
- Production site: `https://suhailsaeedy-design.github.io/suhail-medical-dictionary/`.
- Production callback: `https://suhailsaeedy-design.github.io/suhail-medical-dictionary/auth-callback.html`.
- `public.user_app_state` is live with authenticated-only per-user RLS.
- `anon` has no privileges on `user_app_state`; authenticated users have only SELECT/INSERT/UPDATE/DELETE.
- Cross-user RLS isolation was transactionally tested; a different authenticated user saw zero rows for another user state. Test changes were rolled back.
- Existing self-data RLS policies were tightened to `authenticated` and optimized with `(select auth.uid())`.
- `ai_usage_daily` now has authenticated-own RLS policies instead of policy-less RLS.
- Cloud Admin remains disabled because no owner account has been explicitly identified.

## Remaining external dashboard item
The available Supabase connector does not expose Auth redirect allow-list editing. The exact callback above must be present in Supabase Auth Redirect URLs. The Google provider itself is already in use by existing project identities.

## Security notes
No service-role key, database password or Google client secret is stored in the public website. Existing legacy authenticated SECURITY DEFINER RPCs remain in the project because changing/removing them could break older production behavior; the v21 cloud sync does not depend on them.


## Final QA
- Phase 1–19 regression: PASS.
- Phase 18 readiness verifier: PASS.
- Phase 19 live activation verifier: PASS.
- Production build: 86 runtime files / 2,446,363 bytes.
- Production HTTP smoke: 88/88 URLs returned 200 OK.
- RLS cross-user isolation: PASS (transaction rolled back; no test data retained).
- Supabase performance advisor no longer reports the previous auth.uid() RLS initialization warnings.
- Remaining Supabase security warnings are legacy authenticated SECURITY DEFINER RPCs and leaked-password protection; the v21 Google-only cloud sync does not depend on password auth or those legacy admin RPCs.


## Phase 20 note
وروسته pre-production cleanup کې legacy SECURITY DEFINER RPCs او زاړه v20 application tables لرې شول؛ current schema یوازې `user_app_state` + aggregate admin metrics architecture ساتي.
