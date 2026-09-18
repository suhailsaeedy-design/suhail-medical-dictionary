# د Suhail Medical Dictionary د نشر لنډه طریقه

دا فولډر د Production لپاره جوړ شوی دی. د Dictionary برخه Static/PWA ده، نو آنلاین او د یو ځل Offline Download وروسته افلاین کار کوي. Login/AI/Admin cloud برخې Supabase او Cloudflare Worker ته اړتیا لري.

## ۱ — اول GitHub ته پورته کول

1. په GitHub کې `suhail-medical-dictionary` په نوم Public Repository جوړ کړه.
2. د دې ZIP دننه **د project ټول فایلونه** Repository ته Upload کړه.
3. GitHub → Settings → Pages ته لاړ شه.
4. Source = **GitHub Actions** انتخاب کړه.
5. `main` branch ته Push/Upload چې وشي، موجود Action خپله full MeSH 2026 data له NLM څخه اخلي او Website Publish کوي.

GitHub به لینک درکړي، تقریباً داسې:

`https://YOUR-USERNAME.github.io/suhail-medical-dictionary/`

هر ځل چې ته فایلونه بدل او Push کړې، نو نوی Version به خپله Deploy شي. موبایل/کمپیوټر کې نصب شوی PWA چې انټرنېټ پیدا کړي، نوی Version به واخلي.

## ۲ — Supabase د Login او Chat history لپاره

1. Supabase کې Free project جوړ کړه.
2. SQL Editor کې `supabase/schema.sql` ټول Run کړه.
3. Supabase → Authentication → Providers → Email کې Email/Password فعال وساته. که غواړې د پیل لپاره 100% وړیا عام Signup کار وکړي، **Confirm email موقتي OFF کړه**؛ د Supabase default email sender د عام production ایمیلونو لپاره محدود دی. وروسته چې خپل SMTP ولرې، Confirm email بېرته ON کولی شې.
4. د Project URL او public **publishable/anon key** ارزښتونه په `assets/js/config.js` کې ولیکه.
5. Website بیا Deploy کړه.
6. خپله account په Website کې جوړه کړه.
7. Supabase SQL Editor کې خپل Email Owner کړه:

`update public.profiles set is_owner=true where email='YOUR_OWNER_EMAIL';`

**Service Role Key هېڅکله config.js یا GitHub ته مه پورته کوه.**

## ۳ — Cloudflare AI Worker

1. Cloudflare کې Worker جوړ کړه.
2. `cloudflare-worker/src/index.js` code ورته ورکړه.
3. Workers AI binding نوم `AI` وټاکه.
4. Secrets کې `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ورکړه.
5. `ALLOWED_ORIGINS` کې د خپل Website origin ورکړه.
6. Worker Deploy کړه او Worker URL په `assets/js/config.js` کې `aiWorkerUrl` ته ورکړه.
7. Website بیا Deploy کړه.

## ۴ — Offline استعمال

User دې Online Website خلاص کړي → **Download complete offline dictionary** ووهي → 100% ته انتظار وباسي. وروسته Dictionary بې له انټرنېټه هم خلاصېږي. AI/Login نوي کارونه انټرنېټ غواړي.

## ۵ — Update

ته چې Website کې بدلون راوړې او GitHub ته Push کړې، Action نوی release جوړوي. PWA په موبایل/کمپیوټر کې د Network په راتګ سره update ګوري او نوی Version فعالوي. په بشپړ Offline حالت کې نوی update تر انټرنېټ پورې نشي رسېدلی.

د ډېر تفصیل لپاره `DEPLOY_FREE.md` وګوره.
