# موجود Public Repository د نوې نسخې سره بدلول

دا لارښود د هماغه موجود `suhail-medical-dictionary` Repository لپاره دی.

## مهم: `.git` مه حذفوه

په خپل کمپیوټر کې د Repository فولډر خلاص کړه، مثال:

`D:\GitHub\suhail-medical-dictionary`

که Windows hidden files ښکاره کړي، هلته `.git` فولډر د GitHub Desktop اړیکه ساتي. **دا فولډر مه حذفوه.**

## زاړه فایلونه بدلول

1. GitHub Desktop بندول ضروري نه دي، خو د فایلونو د Copy پر مهال دې Repository همدا وي.
2. د Repository له اصلي فولډر څخه ټول زاړه Project فایلونه او فولډرونه حذف کړه، خو `.git` مه حذفوه.
3. د نوې ZIP دننه ټول فایلونه/فولډرونه مستقیم همدې Repository root ته Paste کړه.
4. باید `index.html`, `app.html`, `.github`, `assets`, `data`, `scripts`, `supabase`, `cloudflare-worker` مستقیم root کې وي.
5. GitHub Desktop ته راشه. Deleted او Added/Modified فایلونه به ښکاره شي.
6. Summary کې ولیکه: `Replace site with v3.1 full dictionary and language update`
7. `Commit to main` ووهه.
8. `Push origin` ووهه.
9. GitHub → Actions کې `Build and deploy Suhail Medical Dictionary` وګوره. شین ✅ چې شي، GitHub Pages خپله نوې نسخه Publish کوي.

## Full Dictionary

Repository source کې یو کوچنی starter dataset ساتل شوی، خو GitHub Action د Publish پر مهال د NLM رسمي MeSH 2026 Descriptor XML download کوي. Production build د لږ تر لږه 25,000 descriptors safety check لري؛ که بشپړ data import نه شي، build fail کېږي او demo data د بشپړ Dictionary په نوم نه Publish کېږي.

## Login مهم دی

v3.1 کې Login اجباري دی. Public Website لومړی `index.html` Email/Password Login ښيي. د واقعي Sign-in/Create Account لپاره Supabase باید configure شي. تر Supabase configure کېدو مخکې ته د Login design په موبایل/کمپیوټر کې کتلای شې، خو Dictionary workspace ته به Sign-in نشې کولی.

## ژبې او ژباړه

Production MeSH source English دی. د Pashto/Dari/Persian/Turkish/Arabic/Chinese لپاره Missing term name, definition او explanation د AI Worker له لارې د اړتیا پر مهال ژباړل کېږي، Supabase shared cache ته ځي او د User په device کې هم offline cache کېږي.

په Pashto کې که د medical term طبیعي/معیاري پښتو معادل نه وي او اصطلاح اساساً نوم، eponym، acronym، drug/Latin/scientific name وي، AI ته هدایت شوی چې جعلي معنا جوړ نه کړي؛ د انګلیسي نوم مناسب پښتو-لیکل شوی/Transliterated شکل وکاروي، او definition/explanation پښتو کړي.

## د لغاتو عکسونه

Dictionary term cards او term detail کې د لغتونو یا اړوندو شیانو عکسونه نشته او نه Import کېږي. یوازې د About Creator پاڼه د Creator عکس لري.
