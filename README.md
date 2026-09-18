# Suhail Medical Dictionary — Production Source

A free-first, mobile-first medical dictionary for students. The static dictionary is designed to work online and offline as a PWA, while optional Supabase + Cloudflare Workers AI provide accounts, private chat history, shared translation caching, owner analytics, and voice-assisted study.

## What is included

- Installable PWA for iPhone/iPad, Android, Windows, macOS and modern browsers.
- Offline complete-dictionary pack with progress reporting and local removal control.
- Automatic version checks and service-worker updates after each production build/deploy.
- English, Pashto, Dari, Persian, Turkish, Arabic and Simplified Chinese language modes.
- NLM MeSH 2026 production importer with student-friendly specialty grouping and small static JSON chunks.
- Search, category filtering, pronunciation, selection, print/PDF, and one-PDF-per-category ZIP workflow.
- Google OAuth accounts through Supabase.
- Separate per-user AI chats with new/rename/delete/copy/edit, selected-term context, speech input, spoken replies, and optional live voice loop where the browser supports speech recognition.
- AI-assisted missing translations cached once in Supabase and also stored locally in IndexedDB after viewing so they can be reused offline on that device.
- Owner-only analytics. Stored chat content is reviewable by the owner only while that user has explicitly opted in to owner review.
- Free-use quotas enforced per user before calling Workers AI.
- Privacy, Terms, offline/update documentation, and medical-education notices.

## Architecture

**Static website / PWA:** HTML + CSS + JavaScript + JSON. No framework or build dependency is needed in the browser.

**Production vocabulary:** `scripts/import_mesh_2026.py` downloads the official NLM MeSH 2026 descriptor XML and produces a lightweight search index plus category chunks. The source ZIP intentionally does not contain the large NLM XML file; the deployment build fetches it from NLM.

**Accounts / database:** Supabase Free using the schema in `supabase/schema.sql`. Row-level security keeps ordinary users restricted to their own data.

**AI:** Cloudflare Worker in `cloudflare-worker/`, using a Workers AI binding. The Supabase service-role key is a Worker secret and must never be placed in frontend files.

## Fastest free publish

Read `START_HERE_PASHTO.md`. The easiest route is GitHub Pages for the static site plus Supabase Free and Cloudflare Workers AI for cloud features. A Cloudflare Pages alternative is also documented in `DEPLOY_FREE.md`.

## Production build

```bash
python scripts/build_release.py --import-mesh
```

This creates `_site/`, imports full MeSH descriptors, generates a unique release version, and stamps the service worker. `_site/` is the directory to publish.

## Important data note

The production importer includes the complete **NLM MeSH 2026 Descriptor vocabulary** plus every entry term/synonym contained in those descriptor records. A safety threshold prevents a partial download from being published as the full dictionary. No term images/media are imported or rendered. The About Creator portrait is separate from dictionary content.

MeSH is a large biomedical controlled vocabulary and an excellent foundation, but no single vocabulary can literally contain every medical expression ever used. MeSH Supplementary Concept Records are a separate, much larger collection and are not included in the default offline pack because they would greatly increase mobile storage and initial search memory.

Full MeSH imported records start with English NLM source text. Missing non-English `term_name`, definition, and explanation are generated on demand, marked as AI-assisted/unreviewed, cached in Supabase and on the device, and should be medically reviewed before being represented as authoritative translations. For Pashto, the translation prompt explicitly avoids inventing meanings for names/eponyms/acronyms/drug/Latin terms: if there is no established Pashto equivalent, it requests a faithful Pashto-script rendering of the English medical name while translating the definition and explanation.

## NLM attribution

Keep a visible notice similar to:

> Medical Subject Headings (MeSH) data source: U.S. National Library of Medicine (NLM), 2026. NLM does not endorse this application.

## Security rules

- Never put `SUPABASE_SERVICE_ROLE_KEY` in `assets/js/config.js`, GitHub source, HTML, or browser JavaScript.
- The public Supabase anon key is used only with row-level security enabled.
- The Worker validates the Supabase access token and verifies chat ownership before writing messages.
- Ordinary users cannot read other users' profiles, chats, or messages.
- Owner analytics are exposed through owner-checking RPC functions.
- Owner chat audit functions return content only for a user whose `allow_owner_review` setting is currently true.
- AI quotas are consumed server-side before inference.

## Browser limitations

Speech synthesis is widely available, but speech recognition support varies. Live voice therefore has a text-chat fallback. AI and cloud login require internet. The downloaded dictionary itself is intentionally independent of AI and remains usable when cloud services or quotas are unavailable.


## About creator
`about.html` contains the creator profile for Suhail Saeedy and uses `assets/images/suhail-saeedy.webp`. The page is included in the PWA offline cache and production build.

## v3.2 secure redesign + full dictionary guard

The default entry page is now a dedicated Google OAuth sign-in screen. `app.html` is guarded and redirects unsigned users back to `index.html`. Signed-in users keep separate AI chat data under Supabase Row Level Security. The default UI was fully redesigned as a clean, mobile-first medical workspace with a calmer color system, compact navigation, clearer search/category controls, a focused term detail panel, and a dedicated AI study area.

Because login is mandatory in v3.2, configure the public Supabase URL and publishable/anon key in `assets/js/config.js` before deploying this version to production. Never place a service-role key in frontend files.


For replacing an already-published repository, see `REPLACE_EXISTING_REPO_PASHTO.md`.


## Google Login

د Google-only Login لپاره `GOOGLE_LOGIN_SETUP_PASHTO.md` وګورئ.


## Google-only account identity

The public login UI uses Supabase Google OAuth only. A first Google sign-in creates the Supabase Auth user automatically; later sign-ins with the same Google account resolve to the same Supabase user identity. Private rows are keyed by `auth.uid()` / `user_id`, while email is stored only as profile/display metadata. The application never handles the user's Google password.
