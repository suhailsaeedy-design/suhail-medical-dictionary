# GitHub Public Deployment — مهم امنیتي یادښتونه

دا package د public GitHub repository لپاره پاک شوی دی.

- هېڅ Supabase Service Role key، Google Client Secret، Cloudflare secret، `.env`، private key یا password په repository کې مه اچوئ.
- `assets/js/config.js` کې Supabase publishable/anon key د browser frontend لپاره public key دی؛ امنیت د Supabase Row Level Security (RLS) policies له لارې ساتل کېږي.
- Cloudflare Worker secrets یوازې Cloudflare Dashboard/`wrangler secret` کې وساتئ.
- د PWA لپاره users ته د source ZIP download مه ورکوئ؛ `Install App` button وکاروئ.
- Public repository قصداً د هر چا لخوا clone/download کېدای شي. که source code پټ ساتل غواړئ، repository private وساتئ او deployment جلا تنظیم کړئ.
- `ai-config.json` کې `workerUrl` د Cloudflare Worker له deploy وروسته د خپل `workers.dev` URL سره ډک کړئ.
