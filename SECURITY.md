# Security

This repository contains only public frontend configuration and deployment code.

Never commit any password, Supabase service-role key, Cloudflare API token, private API key, or other secret. Public Supabase publishable/anon keys may be used in the browser only together with correctly configured Row Level Security (RLS).

For the production site, keep privileged secrets only in server-side secret storage such as Cloudflare Worker secrets.


## Google-only authentication
Users authenticate with Google through Supabase OAuth. The application never requests or stores a Google password. User-owned rows remain keyed to the Supabase Auth UUID (`auth.uid()`), not to a mutable display email.
