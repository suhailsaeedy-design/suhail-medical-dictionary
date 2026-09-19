# موجود GitHub Repository د v17.0 Final سره Replace کول

دا لارښود د هماغه موجود `suhail-medical-dictionary` Repository لپاره دی.

## `.git` مه حذفوه
مثال:
`D:\GitHub\suhail-medical-dictionary`

`.git` فولډر د GitHub history/remote اړیکه ساتي. دا مه Delete کوه.

## Replace
1. Repository folder خلاص کړه.
2. `.git` پرته زاړه project فایلونه/فولډرونه حذف یا Replace کړه.
3. د v17 Final ZIP ټول contents مستقیم repository root ته Paste کړه.
4. GitHub Desktop کې changes وګوره.
5. Summary:
   `Suhail Medical Dictionary v17.0 final real-code reference rebuild`
6. `Commit to main` → `Push origin`.
7. GitHub Actions deployment شین ✅ کېدو وروسته website Hard Refresh کړه.

## Login
Login د Google account له لارې Supabase OAuth کاروي. Website د Google password نه غواړي او نه یې ذخیره کوي. د setup لپاره `GOOGLE_LOGIN_SETUP_PASHTO.md` وګوره.

## Dictionary data
Local repository د development/starter data ساتي. GitHub production build د NLM MeSH 2026 Descriptor XML import کوي.

## Medical visuals
v17 د term cards، detail، hero او AI لپاره individual project medical artwork assets کاروي. Approved/generated full-page reference screenshots د background، overlay یا fake UI په توګه نه کارول کېږي.

## AI
Online AI تر هغې live نه دی چې Cloudflare Worker deploy او `ai-config.json`/config کې Worker URL تنظیم نه شي. `CLOUDFLARE_AI_SETUP_PASHTO.md` وګوره.
