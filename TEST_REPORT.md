> Current UI release: **v6.2.0** — selection/filter/RTL/theme interaction fixes.

# Suhail Medical Dictionary v6.1 — Test Report

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
v5.0 removes the remote Supabase JavaScript SDK from the critical login/workspace boot path. Authentication and database access use Supabase HTTPS endpoints directly, so a CDN/module initialization failure cannot hold the workspace on an endless loader.


## v6.0 Premium UI validation
- app.html inline JavaScript syntax: PASS (Node --check)
- duplicate HTML IDs: PASS (0 duplicates)
- required workspace control IDs: PASS
- project verification script: PASS
- production static build: PASS
- local 3D medical SVG assets copied into build: PASS
- responsive breakpoints included for desktop/tablet/mobile: PASS
- Google/Supabase auth boot code retained from stable v5 path: PASS (not redesigned)


## v6.1 interaction/path validation
- `app.html` dynamic imports resolve to existing files under `assets/js/`: PASS
- `ai.js`, `export.js`, `pwa.js` root-path 404 regression: FIXED
- Local HTML asset/module references validation: PASS
- Duplicate ID validation: PASS
- All JavaScript syntax checks: PASS
- Production static build with required module/3D asset files: PASS
- Account menu, Bookmarks, History, Settings, Grid/List and detail-action handlers are wired in source.
- Mobile CSS includes 820px, 560px and 390px layouts with single-column cards on small phones.
- Note: full browser automation is not available in this execution environment due administrator navigation restrictions; GitHub Pages runtime should still be checked once after deployment.
