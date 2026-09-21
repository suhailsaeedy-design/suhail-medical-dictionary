# Suhail Medical Dictionary v21 — Phase 12 راپور

## Phase 12: Unified Search, Cross-Navigation & Accessibility Hardening

دا checkpoint د Phase 1–11 clean architecture ساتي او د Dictionary، Clinical Reference، 3D Anatomy او AI Study ترمنځ navigation/keyboard usability پیاوړې کوي.

### اصلي بدلونونه
- Topbar search اوس Dictionary، Clinical Reference او 10 Anatomy systems کې grouped quick results ښيي.
- `Ctrl/Cmd+K` او `/` د Global Search focus کوي؛ Arrow keys، Enter او Escape keyboard navigation لري.
- `data/crosslinks.json` په deterministic ډول **189 Dictionary terms** له **250 Anatomy structures** سره نښلوي.
- Dictionary detail څخه موجود bundled Anatomy structure ته direct deep-link شته.
- Anatomy detail څخه matching Dictionary term ته direct link شته.
- Clinical Reference د `clinical + clinicalTerm` deep-link مني او exact reference پرانیزي.
- Skip-to-content، focus-visible، ARIA combobox/listbox/live status، mobile menu aria-expanded او coarse-pointer 44px touch targets اضافه شول.
- Unified Search runtime د Core Offline Shell برخه ده؛ cross-link data د Dictionary او Anatomy دواړو offline packs کې شامل دی.

### دقت او طبي حدود
Cross-links یوازې navigational دي او د bundled English structure/term names د exact یا side-neutral name matching پر اساس جوړېږي. دا links diagnosis، treatment recommendation یا clinical relationship نه ادعا کوي.

### Browser limitation
Automated Chromium یوازې هغه وخت PASS بلل کېږي چې DOM واقعاً load شي. که container runtime/DBus Chromium بند کړي، راپور کې limitation واضح پاتې کېږي.

### وروستی Verification
- Phase 1–12 regression verifiers: PASS
- Cross-links: 189 Dictionary terms / 250 Anatomy structures
- Fresh local HTTP smoke: 69/69 unique URLs = 200 OK
- JavaScript syntax / JSON parse / CSS structure / local references / duplicate IDs: PASS
- Chromium environment probe: timeout (12s), DOM=0, DBus/runtime errors; live-browser PASS نه دی اعلان شوی.
