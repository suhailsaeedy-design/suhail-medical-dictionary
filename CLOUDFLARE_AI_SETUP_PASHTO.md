# د Suhail Medical Dictionary د AI او ژباړې وروستی Setup

دا پروژه د Dictionary لپاره په GitHub Pages کې Static پاتې کېږي. حقیقي AI Chat او د نشتو ژباړو تولید د Cloudflare Worker + Workers AI له لارې کېږي.

## مهم امنیتي اصل
`SUPABASE_SERVICE_ROLE_KEY` هېڅکله GitHub، `config.js`، `ai-config.json` یا Browser code ته مه اچوه. دا یوازې د Cloudflare Worker د **Secret** په توګه وساته.

## 1) Cloudflare Worker جوړول
1. Cloudflare Dashboard خلاص کړه.
2. **Workers & Pages** ته لاړ شه.
3. **Create application / Create Worker** ووهه.
4. نوم: `suhail-medical-dictionary-ai`
5. د Worker code ټول content د `cloudflare-worker/src/index.js` له فایل څخه Copy/Paste کړه.
6. Deploy/Save کړه.

## 2) Workers AI binding
د Worker Settings > Bindings کې:
- Add binding
- Workers AI
- Variable name: `AI`

## 3) Variables / Secrets
دا values اضافه کړه:

Public variable:
- `SUPABASE_URL` = `https://qdfylefkkkyjwtqqiuye.supabase.co`
- `SUPABASE_ANON_KEY` = ستا Supabase Publishable/Anon key
- `ALLOWED_ORIGINS` = `https://suhailsaeedy-design.github.io`
- `AI_DAILY_USER_LIMIT` = `30`
- `TRANSLATION_DAILY_USER_LIMIT` = `30`

Secret:
- `SUPABASE_SERVICE_ROLE_KEY` = د Supabase Service Role key

## 4) Health test
د Worker URL آخر کې `/health` خلاص کړه. مثال:
`https://suhail-medical-dictionary-ai.<your-subdomain>.workers.dev/health`

باید JSON راشي چې `ok: true` وي.

## 5) Website د Worker سره نښلول
د project root کې `ai-config.json` خلاص کړه:

```json
{
  "workerUrl": "https://YOUR-WORKER.workers.dev"
}
```

خپل حقیقي Worker URL ولیکه، Save یې کړه، بیا GitHub ته Commit/Push کړه.

له دې وروسته:
- AI Study chat کار کوي.
- هر user خپل جلا chat history لري.
- Missing Pashto/Dari/Persian/Turkish/Arabic/Chinese translations تولیدېږي.
- ژباړه په Supabase cache کې ساتل کېږي، نو بل ځل بیا AI مصرف نه کوي.
- د Browser په IndexedDB کې هم translation ساتل کېږي څو وروسته Offline وکارول شي.
