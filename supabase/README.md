# Optional Supabase setup — Phase 7

Core v21 works without Supabase. Use this only if you want Google sign-in and cross-device sync.

1. Create/use a Supabase project and enable the Google Auth provider.
2. In Auth URL Configuration, add the deployed `auth-callback.html` URL to Redirect URLs.
3. Run `phase7_user_app_state.sql` in the SQL editor.
4. Edit `data/auth-config.json`:
   - `enabled: true`
   - `supabaseUrl`: `https://<project-ref>.supabase.co`
   - `publishableKey`: the browser-safe publishable key (legacy anon key can also work if your project still uses it)
   - `sync.enabled: true` if cross-device sync is wanted.
5. Do **not** put the service-role key, database password, Google client secret, or any other secret in this repository.

The SQL enables RLS and allows an authenticated user to read/write only the row whose `user_id` equals `auth.uid()`.
