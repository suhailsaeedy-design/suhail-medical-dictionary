# v6.1 — د Button / Mobile / Module Path اصلاح

په v6.0 کې UI پورته کېده، خو درې lazy-loaded module فایلونه له غلط root path څخه غوښتل کېدل:

- `./ai.js`
- `./export.js`
- `./pwa.js`

اصلي فایلونه په `assets/js/` کې وو. له همدې امله AI، PDF/ZIP او Offline/PWA اړوند بټنونه 404 ورکول او داسې ښکارېدل لکه پروژه نیمګړې Upload شوې وي.

## v6.1 اصلاحات

- AI module path: `./assets/js/ai.js`
- Export module path: `./assets/js/export.js`
- PWA module path: `./assets/js/pwa.js`
- Account button اوس حقیقي dropdown menu لري.
- `Use another Google account` او `Sign out` جلا بټنونه لري.
- Bookmarks اوس حقیقي filter دی او شمېر ښيي.
- History اوس وروستي لیدل شوي لغاتونه ښيي.
- Settings اوس modal panel لري.
- Grid/List view بټنونه کار کوي.
- Sort control A–Z / Z–A لري.
- Detail bookmark، Detail PDF او Detail tabs فعال دي.
- موبایل کې cards یو-column ته راځي او account menu/mobile nav ښه تنظیم شوي.
- Offline cache کې auth/config او ټول local medical SVG visuals شامل شول.
- `verify_project.py` اوس broken local references او dynamic import paths هم check کوي.
- GitHub Action د deploy نه مخکې verification اجرا کوي؛ که داسې broken path بیا پیدا شي، deploy باید fail شي.

## مهم

AI chat د Cloudflare Worker URL ته اړتیا لري. که `assets/js/config.js` کې `aiWorkerUrl` تش وي، Dictionary، Login، PDF، Offline او نور UI کارونه به کار کوي، خو remote AI answer به تر Worker setup پورې نه راځي.
