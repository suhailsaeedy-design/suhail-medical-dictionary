# Cloud admin setup — intentionally disabled until owner identity is assigned

The public web app must never contain a Supabase `service_role` key, secret key, database password, or Google provider secret.

1. Complete the Phase 7 Auth + `user_app_state` setup first.
2. Run `phase10_admin_metrics.sql` in the Supabase SQL editor.
3. Assign authorization **server-side** in the intended admin user's `raw_app_meta_data` / `app_metadata`, using `smd_role` with value `owner` or `admin`.
4. Do not use `user_metadata` for authorization; users can edit their own user metadata.
5. In `data/admin-config.json`, set `cloudAdmin.enabled` to `true` only after the database function and role assignment are ready.
6. Ensure `data/auth-config.json` has normal publishable browser configuration. Leave `allowServiceRoleInBrowser` as `false`.
7. Sign out and sign back in after changing app metadata so a fresh JWT contains the current role claim.

The console only requests the aggregate `smd_admin_metrics` RPC. It does not fetch `user_app_state.state`, other users' email addresses, or any raw study snapshot.
