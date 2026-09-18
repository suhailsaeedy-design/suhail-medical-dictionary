# GitHub ته د پورته کولو لنډه طریقه

1. د ZIP فایل Extract کړه.
2. د Extract شوي فولډر **دننه ټول files/folders** خپل `suhail-medical-dictionary` repository ته واچوه.
3. مهمه ده چې `.github`, `assets`, `data`, `scripts`, `supabase` او نور ټول فولډرونه هم پورته شي.
4. GitHub → Settings → Pages ته لاړ شه او Source د **GitHub Actions** وټاکه.
5. GitHub → Actions کې `Build and deploy Suhail Medical Dictionary` وګوره.
6. کله چې workflow شین/Success شي، خپل GitHub Pages URL په `Ctrl + F5` سره Refresh کړه.

Google Client Secret هیڅکله GitHub ته مه پورته کوه. په پروژه کې یوازې public Supabase publishable key شته.
