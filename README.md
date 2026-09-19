# Suhail Medical Dictionary v18.0 Final

Suhail Medical Dictionary is a responsive medical-learning web app/PWA with a real HTML/CSS/JavaScript interface, Google account authentication through Supabase, medical-term search and filtering, Selected terms, Bookmarks, History, Offline Packs, PDF/Print actions, AI Study, multilingual/RTL support, Appearance settings, About, and owner/admin pages.

## v18 design contract

- Desktop **Dark** is the master structural design.
- Desktop **Light** uses the same geometry, spacing, component positions, and responsive behavior, with a bright blue/white palette.
- Mobile Light and Dark have dedicated responsive treatments matching the approved mobile references.
- Approved/generated full-page screenshots are visual references only. They are not used as full-page backgrounds, overlays, click maps, or fake screens.
- UI remains real, interactive HTML/CSS/JavaScript.

## Authentication

Login remains **Google account only** through Supabase OAuth. The site must never ask for or store a user's Google password. `prompt=select_account` is preserved so users can choose another Google account.

## Data and deployment

Production GitHub Pages builds use NLM MeSH 2026 Descriptor XML through:

`python scripts/build_release.py --import-mesh`

The deployment workflow is `.github/workflows/deploy-pages.yml`.

## Important v18 files

- `assets/css/v18-desktop.css`
- `assets/css/v18-login.css`
- `assets/css/v18-mobile.css`
- `assets/css/v18-detail.css`
- `assets/css/v18-phase4-ai-settings.css`
- `assets/css/v18-final-integration.css`
- `assets/js/v18-desktop.js`
- `assets/js/v18-mobile.js`
- `assets/js/v18-detail.js`
- `assets/js/v18-phase4-ai-settings.js`
- `assets/js/v18-final-integration.js`

## External services

Google OAuth, Supabase cloud data, the NLM MeSH download during the production build, and the optional AI Worker need reachable external services and correct dashboard configuration. `ai-config.json` is intentionally blank by default until the Cloudflare Worker URL is configured.

## Verification

See `FINAL_TEST_REPORT_V18.md` for the final source/build/browser audit.
