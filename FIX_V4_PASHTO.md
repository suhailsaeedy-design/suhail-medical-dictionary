# v4.0 — د Workspace/Login اصلي اصلاح

دا نسخه د پخواني Supabase browser SDK پر ځای مستقیم Supabase Auth + REST API کاروي. هدف دا دی چې `Opening your study workspace…` کې بې پای بند پاتې کېدل ختم شي.

## مهم بدلونونه
- د Supabase JavaScript SDK/CDN dependency د Login او Session لپاره لرې شوی.
- Google OAuth callback په `index.html` کې مستقیم لوستل او session په محلي storage کې خوندي کېږي.
- `app.html` session له local storage څخه سمدستي اخلي؛ د SDK initialization یا Web Locks انتظار نه کوي.
- که token زاړه شي، Supabase refresh token له REST endpoint څخه تازه کېږي.
- `Use another Google account` local session پاکوي او Google account chooser خلاصوي.
- AI/PDF/PWA modules lazy-load کېږي؛ د یوه optional module خطا نور Dictionary نه بندوي.
- Supabase database calls د RLS سره مستقیم PostgREST/RPC له لارې کېږي.

## GitHub ته د بدلولو طریقه
1. په `D:\GitHub\suhail-medical-dictionary` کې ټول زاړه فایلونه حذف کړه، خو `.git` مه حذفوه.
2. د دې ZIP دننه ټول فایلونه مستقیم repository فولډر ته Paste کړه.
3. GitHub Desktop کې Summary ولیکه: `Replace auth loader with stable REST auth v4.0`
4. `Commit to main` او بیا `Push origin` ووهه.
5. GitHub Actions چې شین ✅ شي، Website په root URL خلاص کړه.
6. یو ځل `Ctrl + Shift + R` ووهه.

## امنیت
- `assets/js/config.js` کې public Supabase publishable key دی؛ دا د browser لپاره جوړ شوی.
- Google Client Secret او Supabase service-role key هېڅکله frontend/GitHub ته مه اچوه.
