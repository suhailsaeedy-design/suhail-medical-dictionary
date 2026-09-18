# Suhail Medical Dictionary v10.0

A GitHub Pages-ready responsive medical dictionary/study workspace matching the supplied neon-blue and light glass 3D reference designs.

## Included

- Desktop + mobile responsive UI with Light as the default theme and Blue/Midnight/Aurora/Nebula/Minimal alternatives.
- Mobile slide-out navigation and bottom navigation.
- Functional dictionary search, category filtering, advanced filters, filtered Select All, grid/list views, selected terms, bookmarks and history.
- Clickable medical images and checkboxes, interactive detail panel, drag-to-rotate 3D-style term art, pronunciation, synonyms and related terms.
- AI Study workspace with private local chat history, new chat, search, rename and delete. An optional server AI endpoint can be added in `assets/js/config.js`; the built-in educational assistant remains available when it is blank.
- Google + email authentication through Supabase Auth using direct REST calls (no external Supabase JavaScript CDN dependency). Google uses `prompt=select_account` so the user can choose a different Gmail account.
- Print and browser “Save as PDF” workflows.
- Complete offline-pack service-worker flow.
- About and Settings remain inside the main app shell.
- Pointer water/bubble effects, card tilt, glow and reduced-motion controls.
- Automated production data build from official NLM MeSH 2026.

## Medical terminology data

The repository includes a small starter JSON dataset so the source can be tested immediately. The included GitHub Pages workflow runs `scripts/import_mesh_2026.py` during deployment and builds the production site with the complete official 2026 NLM MeSH Descriptor vocabulary and entry terms/synonyms.

The production importer has a safety gate and refuses to publish if fewer than 25,000 descriptors are parsed.

## GitHub Pages deployment

1. Upload **all files and folders from this project root** to the root of the `suhail-medical-dictionary` repository on branch `main`.
2. In GitHub repository **Settings → Pages**, choose **GitHub Actions** as the source if it is not already selected.
3. Open **Actions** and let `Build and deploy Suhail Medical Dictionary` complete.
4. Open the GitHub Pages site after the green deployment finishes.

The workflow verifies the project, imports full MeSH 2026, builds `_site`, and deploys it.

## Google / Supabase authentication

The frontend contains only the Supabase project URL and its **public publishable key**. Never put the Google Client Secret into this repository.

For the current GitHub Pages site, Supabase/Google OAuth must allow the callback:

`https://suhailsaeedy-design.github.io/suhail-medical-dictionary/app.html`

The Google sign-in URL explicitly requests the account chooser, so it does not silently force the previously used Gmail account.

## Local verification

Run:

```bash
python scripts/verify_project.py
```

For a local web-server preview, serve the folder through HTTP rather than opening files directly so the service worker and authentication redirects behave normally.

## Medical-use note

This is an educational terminology and study product, not a diagnostic or emergency-care service. Medical decisions should be checked against authoritative clinical sources and qualified professionals.
