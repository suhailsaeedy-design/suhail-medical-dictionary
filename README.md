# Suhail Medical Dictionary v21.17.0 — Final Release

This is the v21.17.0 Final Release source package. It retains the completed Phase 1–16 feature set and adds Phase 17 final release QA, integrity verification and final packaging.

## Phase 1 retained
- Two-action login card with required Privacy + Terms consent.
- Dark/Light plus English, Pashto, Dari, Persian, Arabic, Turkish and Chinese UI support.
- Responsive shared sidebar/topbar shell.
- 1,158-term / 17-category Dictionary, filtering, 1/2/3-column views, bookmarks, history and detail drawer.
- Clinical Reference remains collapsible inside Dictionary.
- PWA + GitHub Pages foundation.

## Phase 2 retained
- `anatomy.html` in the same shared shell.
- Skeleton / Muscles chooser and Male/Female schematic proportion presets.
- Exactly 206 individually selectable bones plus 50 selectable major muscles.
- Rotate, pan, zoom, reset, isolate, labels, search, highlight, pronunciation and muscle-layer controls.

> The bundled Anatomy geometry is a simplified educational schematic, not a diagnostic/commercial clinical atlas mesh.

## Phase 3
- `ai.html` in the same shared shell.
- Offline Local Study Engine driven only by bundled Dictionary data.
- Explain, Compare, Quiz, Flashcards and Summary tools.
- Searchable Study Context with selected medical terms.
- Per-account local saved chats with New / Rename / Delete.
- Mobile saved-chat drawer, quick actions and sticky composer.
- Optional cloud AI adapter is present but disabled by default.
- `zeroCostMode: true`, blank cloud endpoint, `allowPaidFallback: false`.
- Educational boundary: no diagnosis, prescribing, medication dosing or treatment plans.

## Local use
Serve the project over HTTP. Open `index.html`, accept Privacy + Terms, sign in with a local email, then use Dictionary, 3D Anatomy, AI Study or Offline Packs.

## Verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
```
The GitHub Pages workflow runs every completed Phase verifier (Phase 1 through Phase 21), builds a clean `_site` production artifact, verifies it, and deploys only that artifact.

## Phase 4
- Clinical Reference remains inside Dictionary; no separate Sidebar destination was added.
- 185 bundled Conditions, 135 Procedures/Tests and 87 Pharmacology concepts are searchable/filterable from the existing Dictionary dataset.
- Reference detail includes definition, explanation, synonyms, source, Dictionary handoff, AI Study handoff and pronunciation.
- Seven educational numeric calculators are bundled: safe unit conversions plus Pulse Pressure and Mean Arterial Pressure formulas. No diagnosis, treatment interpretation or medication dosing is generated.
- Interaction Safety documents a guarded future architecture instead of inventing medication-pair advice.
- Learning routes connect Dictionary, 3D Anatomy and the offline Local Study Engine.

## Phase 4 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
```


## Phase 5
- `offline.html` uses the same shared shell.
- Core Offline Shell is automatic; Dictionary/Clinical, Anatomy/Muscles and Local AI Study are separate Cache Storage packs.
- Download/remove status is verified against actual cached responses.
- Browser storage estimate and online/offline status are visible.
- Central PWA installer supports browser install prompts and iPhone/iPad Add to Home Screen guidance.
- Optional cloud AI is never required for offline Local Study.

## Phase 5 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
python verify_phase5.py
```


## Phase 6
- `Selected Terms` is now a persistent Dictionary mode backed by `smd21_selected` local storage.
- Term cards and term detail can add/remove Selected terms; the Selected workspace can clear the set or hand up to 8 terms directly to AI Study context.
- `about.html` and `settings.html` are dedicated shared-shell pages; old duplicated About/Settings modals were removed from Dictionary, Anatomy, AI Study and Offline Packs.
- Settings provides Theme, Language, text-size, reduced-motion and Dictionary-column preferences, plus local data counts and clear controls.
- About documents the current bundled scope, creator, zero-cost/local design and educational medical limitations.
- About/Settings and their runtime are part of the Core Offline Shell.

## Phase 6 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
python verify_phase5.py
python verify_phase6.py
```


## Phase 7
- Local study data is separated by account-scoped storage keys; legacy Phase 1–6 global Selected/Bookmarks/History data migrates once into the active profile.
- Optional Google sign-in uses Supabase Auth only when `data/auth-config.json` is explicitly configured. The default configuration is disabled and blank.
- OAuth callback verifies the returned Supabase access token against `/auth/v1/user`; cloud session tokens are stored only in `sessionStorage`.
- Settings provides explicit Connect / Pull & merge / Push snapshot / Disconnect cloud controls. Disabled or unconfigured cloud controls do not masquerade as working features.
- Optional cross-device sync covers Selected Terms, Bookmarks, History, local AI Study chats and interface preferences.
- `supabase/phase7_user_app_state.sql` creates the optional sync table with RLS policies that restrict every operation to `auth.uid() = user_id`.
- Browser code accepts only a publishable/legacy anon key; no service-role key, database password or provider secret belongs in this repository.

## Phase 7 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
python verify_phase5.py
python verify_phase6.py
python verify_phase7.py
```

## Phase 8
- Dictionary Search and Advanced Filters are fully wired; Advanced Filters can require synonyms, Clinical Reference links or curated related terms and can sort results.
- `Select filtered` adds only the current filtered result set to Selected Terms; selected terms can be exported as a local CSV file.
- Term Detail now includes MeSH ID, curated Related Terms, pronunciation, AI Study handoff, direct PDF download, browser Print, copy-summary and Offline Pack actions.
- PDF generation is local and dependency-free. The downloadable PDF uses the canonical English reference text for broad PDF font compatibility; browser Print uses the currently displayed localized text.
- Deep links such as `app.html?term=D006973#dictionary` open the requested term directly.
- No paid API, PDF service, print service or cloud dependency is required for these tools.

## Phase 8 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
python verify_phase5.py
python verify_phase6.py
python verify_phase7.py
python verify_phase8.py
```


## Phase 9
- Anatomy chooser/viewer now includes 10 focused systems: Skeleton, Muscles, Joints, Ligaments, Organs, Nerves, Vessels, Teeth, Eye and Sinuses.
- Phase 2 baseline remains intact: exactly 206 bones and 50 major muscles.
- New bundled structure coverage: 24 joints, 29 ligaments, 15 organs, 24 nerves, 25 major vessels, 32 permanent teeth, 14 eye structures and 8 sinus structures.
- Every expanded structure has English + Latin terminology, anatomical location, a short educational note, search/list selection, canvas hit selection, labels, isolate and pronunciation.
- The same rotate/pan/zoom/reset controls and Male/Female proportion presets are retained.
- Expanded models are dependency-free schematic polyline/polygon geometry; they are not diagnostic, surgical-planning or commercial-atlas meshes.
- The Anatomy offline pack now includes all 10 systems and their local model files.

## Phase 9 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
python verify_phase5.py
python verify_phase6.py
python verify_phase7.py
python verify_phase8.py
python verify_phase9.py
```

## Phase 10
- `admin-login.html` and `admin.html` provide a separate Owner/Admin maintenance route; no Admin item is added to the public workspace sidebar.
- Local diagnostics inspect bundled Dictionary/Clinical/Anatomy counts, localization coverage, critical same-origin files, Service Worker/offline-pack state and only the active account's own local Selected/AI-chat counts.
- The console exports a local JSON diagnostics report and does not write repository files or pretend that static GitHub Pages can securely edit server content.
- Optional cloud admin authorization reads a server-managed `app_metadata.smd_role` claim (`owner` or `admin`). User-editable metadata is never used for authorization.
- `supabase/phase10_admin_metrics.sql` exposes aggregate-only sync metrics through a protected RPC. The security-definer implementation is kept in a non-exposed `private` schema, includes an explicit role check, and does not return raw user state or email addresses.
- Admin pages are intentionally excluded from the Core Offline Shell. Hiding the route is not treated as access control.

## Phase 10 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
python verify_phase5.py
python verify_phase6.py
python verify_phase7.py
python verify_phase8.py
python verify_phase9.py
python verify_phase10.py
```


## Phase 11
- Seven-language shared UI: English, Pashto, Dari, Persian, Arabic, Turkish and Chinese.
- RTL mirroring for Pashto, Dari, Persian and Arabic; LTR for English, Turkish and Chinese.
- Shared `assets/js/i18n.js` runtime across Login, Dictionary, Anatomy, AI Study, Offline Packs, Settings, About, Privacy/Terms, Admin and auth callback.
- Legacy `fa` (previous Dari preference) migrates once to `prs`; Persian now uses `fa`.
- UI translation is offline because the i18n runtime is part of the Core Offline Shell.
- Medical term/anatomy corpus is not falsely machine-translated: unsupported medical content falls back to English while existing draft Pashto/Persian-script fields remain available.

## Phase 11 verification
```text
python verify_phase11.py
```

## Phase 12
- Unified Topbar search groups quick results from bundled Dictionary terms, Clinical Reference-linked entries and all 10 Anatomy systems.
- `Ctrl/Cmd+K` and `/` focus the unified search. Arrow Up/Down changes the highlighted result; Enter opens it; Escape closes the result panel.
- Deterministic `data/crosslinks.json` links 189 Dictionary terms to 250 bundled Anatomy structures using exact or side-neutral English-name matching only.
- Dictionary term detail shows direct 3D Anatomy links when a supported bundled structure exists; Anatomy detail links back to the matching Dictionary term.
- Clinical Reference accepts deep links to a specific module + term, so search and Dictionary actions can open the exact reference entry.
- Shared pages receive a keyboard skip-link, combobox/listbox semantics, live result status, mobile-menu `aria-expanded`, stronger focus visibility and 44px coarse-pointer touch targets.
- Unified search runtime is part of the Core Offline Shell; cross-link data is bundled with both Dictionary and Anatomy offline packs.

## Phase 12 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
python verify_phase5.py
python verify_phase6.py
python verify_phase7.py
python verify_phase8.py
python verify_phase9.py
python verify_phase10.py
python verify_phase11.py
python verify_phase12.py
```

## Phase 13
- Settings now provides a portable JSON backup for the active account's Selected Terms, Bookmarks, History, local AI Study chats and interface preferences.
- Backup files deliberately exclude cloud/session tokens, consent records, Supabase credentials and every other local account profile.
- Restore validates the backup schema, a 5 MB file-size limit and item/chat limits before writing anything. Restore can merge with current data or replace the current account's study data.
- A backup created for another email cannot be restored accidentally: the user must explicitly acknowledge the source-account mismatch, and restoration still targets only the currently signed-in local profile.
- PWA release management checks `version.json` over the network and exposes an explicit Refresh to latest action when deployed release metadata or a waiting Service Worker is newer than the current runtime.
- Service Worker navigations are network-first while online, with cached/offline fallback when the network is unavailable. This reduces stale HTML after GitHub Pages deployments without removing offline access.
- `version.json`, backup/update runtimes and Settings remain in the Core Offline Shell.

## Phase 13 verification
```text
python verify_phase13.py
```

## Phase 14
- `tools/build_release.py` creates a clean deterministic `_site` runtime artifact instead of deploying the repository root.
- Source-only verifiers, phase reports, Supabase SQL/setup files, tools and workflow metadata are excluded from the live site.
- `_site/release-manifest.json` records path, byte size and SHA-256 for every deployed runtime file and is revalidated before deployment.
- A dedicated `404.html` provides a safe GitHub Pages fallback.
- The Pages workflow is split into build and deploy jobs; deploy depends on a successful build and uploads only `_site`.
- Phase 14 originally validated a cloud-disabled deployment checkpoint; later Phase 19 activated the connected Supabase Google Auth + per-user sync configuration. PWA version/cache coherence remains enforced.

## Phase 14 verification
```text
python verify_phase14.py
python tools/build_release.py
```

## Phase 15
- Canonical mobile bottom navigation is now `Home / Dictionary / 3D Anatomy / AI Study / More` across Dictionary, Anatomy, AI Study, Offline Packs, Settings and About.
- `More` opens an accessible sheet containing Selected, Bookmarks, History, Offline Packs, Settings, About, Backup/Restore and Sign out.
- Dictionary hash navigation handles Home/Dictionary/Selected/Bookmarks/History without forcing a page reload.
- Desktop account chip now opens an account menu instead of signing out immediately.
- Shared shell navigation is localized with the existing seven-language UI and is part of the Core Offline Shell.

## Phase 15 verification
```text
python verify_phase1.py
python verify_phase2.py
python verify_phase3.py
python verify_phase4.py
python verify_phase5.py
python verify_phase6.py
python verify_phase7.py
python verify_phase8.py
python verify_phase9.py
python verify_phase10.py
python verify_phase11.py
python verify_phase12.py
python verify_phase13.py
python verify_phase14.py
python verify_phase15.py
python tools/build_release.py
```

## Phase 16 — Visual / 3D-like Interaction Final Polish
- Dictionary cards: layered glass depth, pointer glow and desktop tilt interaction.
- Term Detail illustration: drag/touch tilt, zoom, reset, optional gentle auto-rotation and keyboard controls.
- Reduced-motion support and coarse-pointer/mobile safeguards.
- Visual interactions remain clearly image-based; direct Anatomy links continue to open the separate schematic Anatomy viewer.
- Phase 16 visual runtime is bundled in the Dictionary Offline Pack and clean production artifact.


## Phase 17 — Final Release QA
- Release version: **21.16.0**.
- Re-runs Phase 1–16 regression verification before deployment.
- Performs a final source/production secret scan, JSON/JS/Python syntax checks, HTML duplicate-ID/local-reference/accessibility checks, Offline Pack byte/count validation, PWA cache/version coherence and release-manifest SHA-256 verification.
- Confirms the clean `_site` production artifact contains runtime files only and excludes development verifiers, reports, tools and Supabase SQL/setup files.
- Phase 17 originally shipped with Cloud Auth/Admin/AI disabled; Phase 19 later activated Google/Supabase Auth + per-user sync. Cloud Admin and Cloud AI remain disabled, while the local/offline core still works without them.
- Browser automation limitations in the build container are disclosed rather than reported as a browser PASS.

## Final release verification
```text
python verify_phase17.py
python tools/build_release.py
```


## Post-release Cloud Activation Readiness
- Settings includes a safe Cloud Readiness checker for public Supabase config, callback URL, Auth reachability and Google provider status.
- `CLOUD_ACTIVATION_DEPLOYMENT_GUIDE_PASHTO.md` contains activation/deployment steps.
- `deployment/auth-config.example.json` is a source-only template and is not part of the production `_site` artifact.
- Never place service-role/secret keys, database passwords or Google client secrets in browser files.


## Phase 18 — Cloud Activation Readiness
- Added Settings readiness diagnostics for Supabase public config, callback URL, Auth reachability and Google-provider status.
- Added browser-safe activation/deployment guide and config template.

## Phase 19 — Live Google Auth + Cloud Sync
- Connected the live Suhail Medical Dictionary Supabase project with a publishable browser key only.
- Activated Google OAuth and per-user `user_app_state` cloud sync with RLS isolation.
- Cloud Admin remains disabled until an owner/admin role is deliberately assigned server-side.

## Phase 20 — Pre-Production Schema Cleanup
- Removed unused legacy v20 cloud tables, privileged RPCs and the old auth profile trigger before public launch.
- Current public application schema is only `user_app_state`; aggregate admin metrics use a private role-checked implementation behind a public SECURITY INVOKER wrapper.
- Supabase performance advisor has zero findings after cleanup.


## Phase 21 — Owner Bootstrap & Publish Gate

- Added a private `owner-setup.html` route for one-time Owner activation.
- The bootstrap code is never committed to the website. Supabase stores only its SHA-256 hash in the private schema.
- `smd_claim_owner()` requires an authenticated Google session, refuses a second Owner, expires the bootstrap record, and permanently invalidates the code after a successful claim.
- Cloud Admin is enabled in configuration, but access still requires a verified JWT `app_metadata.smd_role` of `owner` or `admin`.
- Publish Gate verifies safe public config, Google session, per-user sync RLS reachability, Owner role, Cloud Admin config, and aggregate metrics RPC authorization before showing PASS.
- The private bootstrap code is delivered separately from the public release ZIP.
