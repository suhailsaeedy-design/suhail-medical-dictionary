# Suhail Medical Dictionary — د نوي Chat لپاره مکمل Handoff

## 1) پروژه څه ده؟
دا **Suhail Medical Dictionary** ده: یو responsive medical-learning web app / PWA چې د طبي اصطلاحاتو Dictionary، Google account login، هر user ته جلا cloud data، AI Study، Selected terms، Bookmarks، History، Offline packs، PDF/Print، څو ژبې، themes، About او Settings لري.

**اوسنی Final source:** `Suhail Medical Dictionary v16.0 — Reference-Fixed Real-Code Rebuild`

مهم اصل: د approved design screenshots **یوازې visual references** دي. هیڅ screenshot باید د full-page background، overlay، click-map یا fake UI په توګه ونه کارول شي. ټول UI باید حقیقي HTML/CSS/JavaScript components وي.

---

## 2) مهم Design requirement
Owner غواړي UI تر ممکن حده د approved mockups په شان وي:

- Premium blue / white glassmorphism
- Strong blue neon dark theme
- Default theme = **Light**
- 3D-looking medical art (heart, lungs, pancreas, blood, knee, intestine, DNA, etc.)
- Desktop: left sidebar + topbar + hero + search/filter bar + term card grid + right detail panel
- Mobile: compact cards, top menu/hamburger, slide-out drawer, bottom nav, term detail bottom-sheet/page
- Hover/touch animation، soft glow، bubbles/water-ripple style effects
- Term medical visual can animate/rotate; selected-term detail also has 360°/drag feel
- About page must keep the app shell/sidebar; About should not replace the whole product with an unrelated full-screen page
- Account/profile control must be a proper small dropdown/combo menu
- Themes must change the full visual system, not only text color
- RTL languages (Pashto/Dari/Farsi/Arabic) must not break layout

**Do not simplify the UI into a plain admin/dashboard look.**

---

## 3) Functional requirements already implemented / preserved

### Authentication
- Login is **Google account only** through Supabase OAuth.
- Website must **never ask for or store the user's Google password**.
- `prompt=select_account` is used so the user can choose another Google account.
- Returning account panel supports:
  - Continue with current account
  - Use another Google account
- Each user is separated by Supabase authenticated user ID.

### Dictionary
- Search medical terms and synonyms.
- Category/specialty filtering.
- Sort and grid/list modes.
- `Select all` selects only the **currently filtered result set**.
- Term card can be opened by clicking the card/visual; checkbox handles selection.
- Bookmark and History support.
- Right-side desktop detail panel; mobile detail behavior.
- Close detail button.
- Pronunciation.
- Synonyms / MeSH ID / category / related classification.
- Print and PDF actions.
- Add/Remove Selected.
- Offline pack hooks.

### Languages
Current UI/data workflow includes English plus multilingual support, including Pashto, Dari/Persian, Arabic, Turkish, Chinese. RTL layout is required for RTL languages.

### AI Study
- Separate AI Study page.
- Saved chats per authenticated user.
- New chat / Rename / Delete.
- Chat context can use selected medical terms.
- Optional owner-review consent exists in the privacy/account model.
- **Important current state:** `ai-config.json` / `CONFIG.aiWorkerUrl` is blank by default. Online AI responses need the Cloudflare Worker URL to be deployed and configured. The UI is present, but do not claim the remote AI backend is active until that URL is set.

### About
- About section/page is part of the same app visual family.
- Includes professional creator/project information for **Suhail Saeedi**.
- Keep navigation/app shell visible.

---

## 4) Data / medical terminology
Production deployment uses official **U.S. National Library of Medicine (NLM) MeSH 2026** Descriptor XML.

GitHub Action runs:

`python scripts/build_release.py --import-mesh`

which downloads:

`https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.xml`

and builds the complete official 2026 MeSH Descriptor vocabulary plus entry terms/synonyms into chunked site data.

The small repository data can be starter/development data; the GitHub Pages production build imports the full MeSH dataset.

Do not claim NLM endorses the app.

---

## 5) Deployment
### GitHub repository
Repository name:
`suha... / suhail-medical-dictionary` (owner account used in the existing setup: `suhailsaeedy-design`)

Public GitHub Pages URL currently used:
`https://suhailsaeedy-design.github.io/suhail-medical-dictionary/`

GitHub Pages is deployed through:
`.github/workflows/deploy-pages.yml`

Workflow:
1. checkout
2. Python 3.12
3. `python scripts/verify_project.py`
4. `python scripts/build_release.py --import-mesh`
5. configure Pages
6. upload `_site`
7. deploy Pages

When replacing local repo files, **do not delete the `.git` folder**.

Suggested GitHub Desktop Summary:
`Suhail Medical Dictionary v16 reference-fixed final build`

---

## 6) Supabase / Google OAuth
Frontend public config is in:
`assets/js/config.js`

Current Supabase project URL:
`https://qdfylefkkkyjwtqqiuye.supabase.co`

The frontend uses a **publishable/anon key**, which is okay for browser use when RLS is correctly configured.

Never put these in frontend/public GitHub files:
- Google Client Secret
- Supabase service-role key
- Cloudflare/OpenAI/other private API secrets

Database/RLS setup:
`supabase/schema.sql`

Google OAuth provider is configured in Supabase dashboard and Google Cloud. Redirect/site URLs must continue to match the GitHub Pages site.

---

## 7) Important files
- `index.html` — Google login / account chooser
- `app.html` — main Dictionary workspace
- `ai.html` — AI Study
- `about.html` — About
- `offline.html` — offline packs
- `admin.html` — owner/admin functionality
- `privacy.html`, `terms.html`
- `assets/css/styles.css` — base UI
- `assets/css/v16-foundation.css` — v16 visual reference matching layer
- `assets/js/app.js` — main dictionary interactions
- `assets/js/auth.js` — Supabase/Google auth without remote Supabase JS SDK
- `assets/js/login.js` — login behavior
- `assets/js/ai.js`, `assets/js/ai-page.js` — AI/chat flows
- `assets/js/v16-ui.js` — v16 interaction polish
- `scripts/import_mesh_2026.py` — full NLM MeSH import
- `scripts/build_release.py` — GitHub production build
- `scripts/verify_project.py` — source verification
- `sw.js` — PWA/service worker
- `.github/workflows/deploy-pages.yml` — Pages deployment

---

## 8) Current v16 technical status
Before final packaging these checks were run successfully:

- `python scripts/verify_project.py` — PASS
- active JavaScript `node --check` — PASS
- JSON parsing — PASS
- `python scripts/build_release.py` — PASS
- `_site/index.html` and `_site/app.html` generated — PASS
- no active `v13-pixel-lock`, screenshot overlay, or full-page reference-image mechanism found — PASS

The v16 version/cache references were normalized to `16.0.0` before the final package.

External-service behavior cannot be fully validated offline. Google OAuth, Supabase cloud data, NLM download during GitHub build, and AI Worker require reachable external services and correct dashboard configuration.

---

## 9) Critical instruction for the next ChatGPT chat
When continuing this project:

1. **Open/read the ZIP first. Do not rebuild from guesses.**
2. Preserve working Google/Supabase auth and MeSH build architecture.
3. Never solve visual mismatch by placing the approved screenshot as a full-page background/overlay.
4. If changing design, edit actual HTML/CSS components.
5. Keep default Light theme, with strong Dark/Blue theme.
6. Test both desktop and mobile widths.
7. Do not remove existing functionality while improving the design.
8. Check buttons, menus, Select All filter behavior, profile dropdown, detail close, PDF/Print, AI chat rename/delete, mobile drawer, RTL, and theme switching after every major change.
9. Keep code modular/maintainable and GitHub Pages compatible.
10. Do not expose secrets in the repository.

---

## 10) What the owner wants next
The major remaining goal is **visual refinement against the approved reference designs** while keeping the app fully functional. The owner wants the real UI to look extremely close to those designs, especially:

- login composition
- desktop light dictionary
- desktop neon/dark dictionary
- mobile home/dictionary list
- mobile side drawer
- mobile term detail
- AI Study screen
- theme/appearance screen

Do visual matching with real components, not screenshots.
