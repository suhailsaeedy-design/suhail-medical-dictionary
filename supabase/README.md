# Supabase setup — v21.20.0 pre-production clean schema

The connected **Suhail Medical Dictionary** project uses Google Auth plus one per-user cloud state table.

## Current public schema
- `public.user_app_state` only.
- RLS restricts SELECT/INSERT/UPDATE/DELETE to `auth.uid() = user_id`.
- `anon` has no table privileges.
- `authenticated` has only SELECT/INSERT/UPDATE/DELETE on `user_app_state`.
- Legacy v20 `profiles/chats/ai_messages/user_events/ai_usage_daily/term_translation_cache` tables are removed before public launch.
- Legacy privileged RPCs and the old auth-user profile trigger are removed.

## Admin metrics
- `public.smd_admin_metrics()` is a SECURITY INVOKER wrapper.
- Its private implementation checks `auth.jwt().app_metadata.smd_role`.
- It returns aggregate counts only and never raw user state or user email addresses.
- Cloud Admin remains disabled in the browser config until an owner/admin role is deliberately assigned server-side.

## Production callback
`https://suhailsaeedy-design.github.io/suhail-medical-dictionary/auth-callback.html`

That exact URL must be present in Supabase Auth Redirect URLs before public launch.

## Files
- `phase7_user_app_state.sql` — per-user sync table/RLS.
- `phase10_admin_metrics.sql` — aggregate-only admin metrics.
- `phase20_preproduction_cleanup.sql` — idempotent canonical cleanup/current schema.

Never place a service-role key, database password, or Google client secret in this repository.

- `phase21_owner_bootstrap.sql` — one-time hashed Owner bootstrap function/table foundation. Insert a fresh token hash server-side only; never commit plaintext.
