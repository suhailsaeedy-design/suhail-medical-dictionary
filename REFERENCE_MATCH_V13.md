# Suhail Medical Dictionary v13 — Pixel-Locked Reference Build

This release is locked to the approved Suhail Medical Dictionary reference artwork rather than introducing a new visual direction.

## Reference-locked surfaces
- Desktop Light dictionary: the approved light desktop artwork is used as the exact initial visual skin.
- Desktop Dark/Blue dictionary: the approved neon dark artwork is used as the exact initial visual skin.
- Mobile Light dictionary: the home/drawer/detail screens are cropped directly from the approved mobile-light reference composition.
- Mobile Dark dictionary: the home/drawer/detail/AI screens are cropped from the approved dark mobile reference composition.
- Login: approved light and dark login artwork is used as the initial visual skin.
- AI Study: approved light desktop AI Study artwork is used as the initial visual skin; the live AI workspace remains underneath.

The reference skin is not a replacement for the working application. Transparent/accessible interaction regions are mapped to the real controls. When a state must become dynamic (search results, a different term, settings, account menu, PDFs, etc.) the live interface is revealed and the existing functional implementation takes over.

## Product behavior retained
- Google OAuth / Supabase authentication remains the real sign-in path. The site never receives a Google password.
- Per-user selected terms, bookmarks, history, chats, settings and account data remain separated by authenticated user/session logic.
- Search, category filters, Select All, 3D term visuals, details, pronunciation, Selected, Bookmarks, History, PDF/Print, offline packs, account switching, themes, AI Study, chat rename/delete and About remain functional.
- Default theme for a new user is Light. Existing users keep their saved theme preference.
- GitHub Pages workflow continues to build the production site and import the full NLM MeSH 2026 dataset during deployment.

## Accuracy note
The approved reference artwork contains marketing/example counters and example user names. Live application data and authenticated account identity remain authoritative when the interface enters a dynamic state.
