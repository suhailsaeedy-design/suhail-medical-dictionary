# Suhail Medical Dictionary v18.0 — Final Test Report

Final audit performed against the v18 source after all integration fixes.

## Static and build checks

- `python scripts/verify_project.py` — PASS
- Active JavaScript `node --check` — PASS
- Inline JavaScript syntax — PASS
- JSON parsing — PASS
- CSS parsing/balance — PASS
- HTML local file references — PASS
- Service-worker precache local references — PASS
- `python scripts/build_release.py` — PASS
- Production `_site` generation — PASS

## Desktop browser audit

Tested at 1672×941 and 1366×768 in Light and Dark.

- page JavaScript errors: 0
- horizontal overflow: 0
- mobile-only scaffolding on desktop: 0
- Dictionary is the default active navigation item
- main order verified: Hero → Search/Category strip → Terms/Detail work area → Ask Suhail AI strip
- Light and Dark key geometry matched within the browser audit tolerance (≤1.1 px)

At 1672×941 the verified shared geometry was approximately:
- Hero: x 266, y 80, w 1390, h 232
- Search/category: x 266, y 320, w 1390, h 50
- Work area: x 266, y 378, w 1390, h 473
- AI strip: x 266, y 859, w 1390, h 70

## Login browser audit

Tested at 1672×941 and 390×844.

- Google sign-in button visible — PASS
- password input fields: 0 — PASS
- horizontal overflow: 0 — PASS
- page JavaScript errors: 0 — PASS

## Mobile Home/Search/Drawer audit

Tested at 361×905, 390×844, and 430×932 in Light and Dark.

- horizontal overflow: 0 in every tested state
- page JavaScript errors: 0
- Light bottom nav: 4 visible items
- Dark bottom nav: 5 visible items
- Search/list state — PASS
- Drawer open/close — PASS

## Mobile Detail audit

Tested Light and Dark at 361×905, 390×844, and 430×932.

- detail open/close — PASS
- Overview/Synonyms tab switching — PASS
- Action Sheet open/close — PASS
- Added-to-Selected success dialog — PASS
- Dark 360° drag/rotate interaction — PASS
- horizontal overflow: 0
- page JavaScript errors: 0

## AI Study and Appearance audit

AI/Settings tested at mobile sizes and AI also at desktop width.

- New Chat — PASS
- mobile AI navigation drawer — PASS
- chat menu — PASS
- theme/background/accent selection — PASS
- Apply Theme/localStorage persistence — PASS
- Reduce Motion persistence — PASS
- horizontal overflow: 0
- page JavaScript errors: 0

## Secondary pages

About, Offline, Admin, Privacy, and Terms were checked in desktop Light and mobile Dark conditions.

- horizontal overflow: 0
- page JavaScript errors: 0

## RTL audit

Pashto content preference tested at 390×844.

- shell direction remains LTR: PASS
- content direction marker becomes RTL: PASS
- horizontal overflow: 0
- page JavaScript errors: 0

## Reference-image integrity

Approved/generated full-page reference screenshots are not used as UI backgrounds, overlays, click maps, or fake screens. Exact reference-image hash comparison against project files found 0 matches.

## External-service limitation

Google OAuth, Supabase cloud behavior, NLM network download, and the optional AI Worker require live external services and correct dashboard configuration; those network-dependent services cannot be fully validated by an offline/local source audit alone.
