# Suhail Medical Dictionary v18.0

This release is a **real-code rebuild** calibrated against the approved desktop, mobile and login references. The screenshots are design references only; no complete screenshot is used as a page background, overlay, iframe or click-map. The visible interface is live HTML/CSS/JavaScript, with isolated medical illustration assets used inside individual components.

# Suhail Medical Dictionary v16.0

This release is a real-code rebuild of the approved Suhail Medical Dictionary visual references. The user interface is implemented with HTML, CSS, JavaScript, responsive components, and individual medical artwork assets. Full-page reference screenshots are **not** used as page backgrounds or interaction overlays.

## Visual direction
- Default **Light** theme: luminous white/blue glass interface, 3D medical artwork, compact dictionary cards, fixed desktop sidebar, and a right-side term detail panel.
- **Dark / Blue** themes: deep medical-blue neon glass interface with stronger glow, depth, and 3D presentation.
- Mobile: compact two-column cards, slide-out navigation drawer, bottom navigation, and a bottom-sheet term detail panel.
- Pointer/touch: subtle liquid-droplet cursor trail, touch ripple, card lift, and 3D visual motion.

## Functional areas
- Google/Supabase account authentication
- Medical dictionary search and category filters
- Select all for the current filter
- Selected terms, bookmarks, and history
- Pronunciation and multilingual content flow
- Term details and 3D-style visual motion
- AI Study chats with rename/delete support
- Print/PDF tools
- Offline/PWA packs and automatic update flow
- About, Privacy, Terms, Settings, and owner/admin pages

## Production dictionary
GitHub Actions builds the production site with the NLM MeSH 2026 import workflow. The repository includes a compact local starter data set so the source stays manageable; the deployment workflow produces the full production data set.

## Deployment
Commit the extracted project contents to the root of the existing `suhail-medical-dictionary` repository, keep the existing `.git` folder, then push `main`. GitHub Actions deploys the `_site` build to GitHub Pages.
