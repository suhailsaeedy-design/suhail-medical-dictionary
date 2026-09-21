# Suhail Medical Dictionary v20.19.2 — Unified Shell & Anatomy UX

دا build د v20.19 Aqua Glass پر اساس د وروستیو desktop/mobile screenshots له مخې اصلاح شوی.

## اصلي اصلاحات
- Clinical Reference د ټولو Sidebarونو څخه لرې شو؛ اوس یوازې د Dictionary دننه module دی.
- Clinical Reference په Dictionary کې Collapse/Expand بټن لري.
- Desktop Sidebar ته واضح ← / → Collapse/Expand control اضافه شو.
- Topbar په اصلي workspace پاڼو کې Sticky/Frozen شو.
- Mobile Topbar کې یوازې یو Menu button پاتې دی؛ CSS pseudo-menu او duplicate button دواړه لرې شول.
- Mobile Topbar: کوچنی Search + Language + Theme په یوه کرښه کې.
- AI Study هغه وخت هم کوچنی Dictionary Search اخلي چې page-specific search نه لري.
- Dictionary cards ته 1-column / 2-column / 3-column درې مستقل view options اضافه شول او انتخاب localStorage کې ساتل کېږي.
- Light theme د Aqua Glass پر سر واقعاً Light render کېږي.
- Privacy/Terms legacy shell د canonical Sidebar/Topbar classes سره برابر شو.
- `pwa.js` نور په Anatomy/Login کې د classic script په توګه نه load کېږي؛ import syntax error ختم شو.
- Service Worker offline `version.json` fallback اوس تل Response ورکوي؛ `Failed to convert value to Response` bug اصلاح شو.
- Dictionary offline event کې null `#aiStatus` error guard شو.
- Offline حالت کې cloud profile fetch نه اجرا کېږي.

## Anatomy
- Skeleton/Muscles top tabs اوس exclusive دي؛ د checkbox layer panel بیا هم د multiple layers لپاره پاتې دی.
- Skeleton entry یوازې Skeleton خلاصوي او Muscles entry یوازې Muscles.
- Whole-body male/female skeleton د موجود HD meshes سره وصل شو:
  - male: `assets/models/anatomy/hd/skeleton-male.obj`
  - female: `assets/models/anatomy/hd/skeleton-female.obj`
- 206 individually selectable adult bones، red highlight، English/Latin name، location/overview، Pronounce او Auto Voice ساتل شوي.
- Current bundled anatomy لا educational atlas دی؛ commercial dissection atlas نه ادعا کېږي.

## Verification
- v20.19.2 Aqua verifier: PASS
- v20.19.2 Unified Shell verifier: PASS
- JavaScript syntax: PASS
- JSON: 59 files PASS
- HTML local references: 0 missing
- Service Worker precache refs: 0 missing
- OBJ: 882 files PASS
- Vertices: 1,108,972
- Faces: 2,112,176
- Empty/missing OBJ: 0
- Adult bone catalogue: 206

## Browser automation limitation
Container Chromium localhost navigation د administrator policy له امله `ERR_BLOCKED_BY_ADMINISTRATOR` ورکوي. له همدې امله automated visual-browser PASS نه دی ادعا شوی.
