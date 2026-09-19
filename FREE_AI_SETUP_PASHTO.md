# د Suhail Medical Dictionary وړیا AI Setup

دا پروژه paid OpenAI API ته اړتیا نه لري. AI backend د **Cloudflare Workers AI Free plan** لپاره جوړ شوی دی. Model: `@cf/zai-org/glm-4.7-flash`. د model لپاره جلا API key Browser ته نه ورکول کېږي؛ Worker د Cloudflare `AI` binding کاروي.

## مهم اصل
- دا build **Free-only** دی.
- paid model fallback نشته.
- که د Cloudflare ورځنی وړیا quota ختم شي، AI تر reset پورې ودریږي؛ project په اوتومات ډول paid model ته نه ځي.
- Dictionary، 3D Anatomy او downloaded Offline Packs بیا هم کار کوي.

## یوازې یو ځل Setup
1. وړیا Cloudflare account جوړ/خلاص کړه.
2. Workers & Pages > Create Worker ته لاړ شه.
3. د `cloudflare-worker/src/index.js` فایل code Worker ته واچوه.
4. Settings > Bindings کې **Workers AI** binding جوړ کړه، variable یې `AI` وټاکه.
5. Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ALLOWED_ORIGINS`, `AI_DAILY_USER_LIMIT=20`, `TRANSLATION_DAILY_USER_LIMIT=20`.
6. Secret: `SUPABASE_SERVICE_ROLE_KEY` یوازې Worker Secret کې واچوه؛ GitHub/Browser ته یې مه اچوه.
7. Deploy کړه او د Worker HTTPS URL copy کړه.
8. په `ai-config.json` کې `workerUrl` ته هماغه URL ورکړه.

له دې وروسته AI Chat، selected dictionary term context، Pashto/Dari/English ځوابونه او missing-translation generation کار کوي.
