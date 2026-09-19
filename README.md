# Suhail Medical Dictionary v18.0 — Final Refined

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

## Phase 7 polish layer

The current v18 correction build also includes:

- `assets/css/v18-phase7-polish.css`
- `assets/js/v18-phase7-polish.js`

This layer fixes desktop button geometry, full-fit term artwork, sidebar icons/premium block, real 3D card/detail interactions, hero artwork framing, tighter reference-style login composition, desktop inner scrolling, and true fixed mobile topbars.

## v19 Phase 1
- New unified dark medical design foundation based on the approved v19 desktop/mobile concepts.
- Added `3D Anatomy` workspace entry and interactive offline-capable viewer foundation.
- PWA Install App controls added to login and workspace UI.
- Previously authenticated sessions can open cached dictionary content while offline; AI remains online-only.
- Existing Owner Admin remains available; full v19 Admin redesign continues in a later phase.


## v19.0 Phase 3
- Mobile term detail refined with scrollable content and direct View in 3D Anatomy.
- 3D deep links carry the selected term/layer into anatomy.html.
- Mobile Medical News & Learning section uses offline-safe educational study cards (not live-news claims).
- AI Study mobile screen adds assistant hero, Explain/Summarize/Create Quiz/Study Plan shortcuts, Today’s Learning, and unified 5-item navigation.
- New Phase 3 CSS/JS are included in PWA precache.


## v19 Phase 5 anatomy packs
The project now bundles local WebGL OBJ anatomy geometry in Low, Standard, HD and Ultra LODs plus region-isolation meshes. The geometry is an illustrative educational pack, not clinical anatomy. Optional validated BodyParts3D import guidance is in `BODY_PARTS3D_IMPORT_GUIDE.md`.


## v19 Final — Free AI + Database
- Cloudflare Workers AI free-only backend (`@cf/zai-org/glm-4.7-flash`)
- No paid AI fallback; no model API key is exposed in the browser
- Supabase PostgreSQL for accounts, chats, messages, events, translation cache and AI quotas
- IndexedDB/localStorage/Cache API for offline/PWA data
- Admin AI/database health and daily AI usage telemetry
- See `FREE_AI_SETUP_PASHTO.md` and `DATABASE_ARCHITECTURE_PASHTO.md`


## v19 Final Verified

The final source now includes `scripts/final_audit.py`. Run it before deployment to validate references, PWA/offline packs, 3D model manifests, bundled dictionary integrity, theme coverage, and frontend secret hygiene. The bundled local dataset is intentionally compact and internally truthful; the GitHub Pages workflow imports the complete official MeSH 2026 Descriptor vocabulary during production build.
