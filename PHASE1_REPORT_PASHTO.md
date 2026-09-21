# v21 Phase 1 — پاک Rebuild

دا checkpoint د پخواني v20 layered UI ادامه نه ده. HTML/CSS/JS shell له سره جوړ شوی او زاړه v16/v17/v18/v19/v20 presentation files نه load کوي.

## په Phase 1 کې بشپړ شوي کارونه
- Login main card: یوازې Current Email او Other Email actions؛ password field نشته.
- Privacy + Terms دواړه باید check شي؛ له consent پرته app.html نه خلاصیږي.
- Dark/Light theme، English/Pashto/Dari UI foundation.
- Desktop: fixed sidebar + fixed/sticky topbar + body page scroll.
- Mobile: یوازې یو menu button، search، language او theme controls.
- Dictionary: 1,158 terms / 17 categories.
- Search, category filtering, 1/2/3-column views.
- Bookmarks او History localStorage کې.
- Term detail drawer.
- Clinical Reference د Dictionary دننه collapsible دی؛ Sidebar کې جلا item نه لري.
- PWA/service-worker او GitHub Pages workflow.

## مهمه یادونه
Anatomy، AI Study، Offline Packs او Admin په قصدي ډول دې Phase کې نه دي شامل؛ راتلونکو phases کې به هر یو له سره، جلا او بشپړ جوړېږي. دا Phase 1 checkpoint د Final Project په نوم مه publish کوئ.

## QA
- verify_phase1.py: PASS
- JavaScript syntax: PASS
- JSON/webmanifest parsing: PASS
- Local HTTP smoke: PASS (index/app/privacy/terms/data)
- Automated Chromium navigation: environment administrator policy له امله block شو؛ browser PASS نه دی ادعا شوی.
