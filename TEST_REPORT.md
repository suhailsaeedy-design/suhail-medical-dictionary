# Suhail Medical Dictionary v4.0 — Test Report

## Passed checks
- All project JavaScript files pass `node --check`.
- HTML parser validation passed for all top-level HTML files.
- JSON validation passed for manifest, version and dictionary data files.
- Production build script completed successfully.
- Project verification script completed successfully.
- Auth unit test: persisted session fast-path passed.
- Auth unit test: OAuth callback parsing and session persistence passed.
- Auth unit test: `Use another Google account` authorize URL includes `prompt=select_account`.
- REST client unit test: authenticated PostgREST select query construction and response parsing passed.
- Secret scan found no Google Client Secret or Supabase service-role secret embedded in frontend configuration.

## Architecture change
v4.0 removes the remote Supabase JavaScript SDK from the critical login/workspace boot path. Authentication and database access use Supabase HTTPS endpoints directly, so a CDN/module initialization failure cannot hold the workspace on an endless loader.
