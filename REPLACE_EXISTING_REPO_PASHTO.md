# موجود GitHub Repository د v18.0 Final سره Replace کول

دا package د موجود `suhail-medical-dictionary` repository د source فایلونو د بدلولو لپاره تیار شوی.

1. خپل موجود repository په GitHub Desktop کې خلاص کړه.
2. **`.git` فولډر مه پاکوه او مه یې Replace کوه.**
3. د repository نور پخواني project فایلونه پاک/بدل کړه او د دې v18 Final package محتويات د repository root ته copy کړه.
4. ډاډ ترلاسه کړه چې `.github/workflows/deploy-pages.yml`، `assets/`، `scripts/`، `supabase/` او HTML فایلونه موجود دي.
5. GitHub Desktop کې changes وګوره.
6. Summary ولیکه: `Suhail Medical Dictionary v18.0 final reference-matched real-code build`
7. Commit او Push origin وکړه.
8. GitHub Actions/Pages deployment بشپړېدو ته انتظار وباسه.

مهم: private secrets لکه Google Client Secret، Supabase service-role key، Cloudflare/OpenAI private keys په public repository کې مه اچوه.
