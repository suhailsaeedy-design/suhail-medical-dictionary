# v3.4 مهم اصلاحات

- د `Opening your study workspace…` بې پای spinner اصلي علت اصلاح شو. PDF/ZIP بهرني scripts نور د Workspace د خلاصېدو مخه نه نیسي؛ یوازې د Export پر وخت Lazy-load کېږي.
- Session لومړی له local browser storage څخه لوستل کېږي، نو د Supabase `getSession()` د نادر lock/stall په صورت کې هم Dictionary سمدستي خلاصېږي.
- ۹ ثانیې مستقل watchdog شته؛ که JavaScript/module ناکام هم شي، spinner تل نه پاتې کېږي او Retry/Back to sign in ښکاري.
- `Use another Google account` د Google account chooser (`prompt=select_account`) کاروي.
- د Login او App module URL ته version query ورکړل شوی، څو پخوانی cache په زور تازه شي.
