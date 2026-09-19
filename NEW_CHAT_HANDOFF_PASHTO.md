# Suhail Medical Dictionary v18.0 Final — د نوي Chat لپاره Handoff

## 1) اوسنی حالت
دا **v18.0 Final GitHub Replace-ready source** دی. پروژه responsive medical-learning web app/PWA ده: Dictionary، Google/Supabase login، Selected، Bookmarks، History، Offline Packs، PDF/Print، AI Study، څو ژبې، RTL content، themes/Appearance، About او Admin لري.

## 2) مهم design contract
- Desktop Dark د master geometry/layout په توګه استعمال شوی.
- Desktop Light د Dark عین geometry/spacing/component positions لري؛ یوازې palette/brightness/glow روښانه دی.
- Mobile Light/Dark Home، Search/List، Drawer، Detail، AI Study او Appearance dedicated responsive layouts لري.
- Approved/generated screenshots یوازې visual references دي. هیڅ full-page screenshot د background، overlay، click-map یا fake UI په توګه مه کاروه.
- UI باید حقیقي HTML/CSS/JavaScript components پاتې شي.

## 3) Authentication
- Google account only through Supabase OAuth.
- د Google password هېڅکله مه غواړه او مه یې ذخیره کوه.
- `prompt=select_account` وساته.
- هر user د Supabase authenticated user ID له مخې جلا دی.

## 4) Dictionary/functionality چې باید وساتل شي
- term/synonym search
- category/specialty filters
- sort + grid/list
- Select All یوازې filtered result set
- Selected, Bookmarks, History
- desktop right detail + mobile detail
- pronunciation, synonyms, MeSH/category metadata
- PDF/Print
- offline hooks
- mobile Action Sheet او Added-to-Selected success flow
- Dark mobile detail 360° drag interaction

## 5) AI Study
- saved chats per authenticated user
- New/Rename/Delete
- selected-term context
- mobile AI drawer/composer/prompts
- `ai-config.json` / worker URL blank by default؛ remote AI backend تر configuration مخکې active مه ګڼئ.

## 6) Languages/RTL
English او multilingual workflow شامل دی، لکه Pashto، Dari/Persian، Arabic، Turkish او Chinese. د RTL ژبو لپاره content direction RTL کېږي، خو app shell/navigation LTR پاتې کېږي څو layout مات نه شي.

## 7) Data/build
Production GitHub build د NLM MeSH 2026 Descriptor XML import کوي:
`python scripts/build_release.py --import-mesh`

Workflow:
`.github/workflows/deploy-pages.yml`

`python scripts/verify_project.py` او build scripts باید وساتل شي.

## 8) مهم v18 files
- `assets/css/v18-desktop.css`
- `assets/css/v18-login.css`
- `assets/css/v18-mobile.css`
- `assets/css/v18-detail.css`
- `assets/css/v18-phase4-ai-settings.css`
- `assets/css/v18-final-integration.css`
- `assets/js/v18-desktop.js`
- `assets/js/v18-mobile.js`
- `assets/js/v18-detail.js`
- `assets/js/v18-phase4-ai-settings.js`
- `assets/js/v18-final-integration.js`

## 9) Final audit status
- Static verifier — PASS
- JavaScript/JSON/CSS/local refs — PASS
- GitHub production build — PASS
- Desktop Light/Dark geometry audit — PASS
- Login desktop/mobile audit — PASS
- Mobile Home/Search/Drawer — PASS
- Mobile Detail/Action Sheet/Selected/360° — PASS
- AI Study/Appearance — PASS
- About/Offline/Admin/Privacy/Terms — PASS
- Pashto RTL content-direction audit — PASS
- full-page reference screenshot exact matches in project — 0

تفصیلي results په `FINAL_TEST_REPORT_V18.md` کې دي.

## 10) د راتلونکو بدلونونو اصول
1. همدا v18 Final source اول خلاص/ولوله؛ له اټکل څخه rebuild مه کوه.
2. Google/Supabase auth او MeSH architecture مه ماتوه.
3. Screenshot background/overlay مه کاروه.
4. Design changes په حقیقي components کې وکړه.
5. Desktop Dark/Light shared geometry وساته.
6. Desktop او 361/390/430px mobile widths بیا test کړه.
7. Secrets public repo ته مه اچوه.
8. موجود repository Replace کولو پر وخت `.git` فولډر مه پاکوه.

Suggested GitHub Desktop Summary:
`Suhail Medical Dictionary v18.0 final reference-matched real-code build`
