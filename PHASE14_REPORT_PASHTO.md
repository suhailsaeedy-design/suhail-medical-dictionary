# Suhail Medical Dictionary v21 — Phase 14 Production Build & Deployment Hardening

## پایله
Phase 14 د source repository او live GitHub Pages artifact ترمنځ واضح production boundary جوړوي. اوس workflow ټول regression verifiers چلوي، پاک `_site` build جوړوي، release integrity یې تاییدوي او یوازې هماغه runtime artifact deploy کوي.

## Production build
- `tools/build_release.py` هر ځل `_site/` له سره پاک او deterministic جوړوي.
- Runtime pages، `assets/`، `data/`، PWA files، icons/models او قانوني notice deploy کېږي.
- `.github/`، `supabase/`، `tools/`، `verify_phase*.py`، `PHASE*_REPORT_PASHTO.md` او source README live artifact ته نه ځي.
- Symlink deployment منع دی.
- HTML local references او JSON files د build پر مهال audit کېږي.
- `404.html` د GitHub Pages لپاره واضح fallback page دی.

## Release integrity
`_site/release-manifest.json` د هر deployed runtime file لپاره path، byte size او SHA-256 ثبتوي. Manifest هم total file count او total bytes لري. `verify_phase14.py` manifest د actual `_site` bytes سره بیا محاسبه او پرتله کوي.

## Deterministic build
Phase 14 verifier production build دوه ځله پرله‌پسې جوړوي او د release manifest bytes پرتله کوي. دا د دې لپاره دی چې هماغه source په هماغه checkpoint کې ناڅاپي/random release output تولید نه کړي.

## GitHub Pages workflow
Workflow اوس دوه jobونه لري:
1. **build** — Phase 1–14 verifiers، clean production build، Pages setup او `_site` artifact upload.
2. **deploy** — یوازې له بریالي build وروسته `github-pages` environment ته artifact deploy کوي.

Pages permissions د deploy job پورې محدود دي. Artifact path `_site` دی، نه repository root.

## PWA/version coherence
- App version: `21.13.0`
- Service Worker cache: `smd-v21-phase14`
- Offline pack prefix: `smd-v21-phase14-pack-`
- Update Manager current runtime: `21.13.0`

## محدودیتونه
- Supabase/Google cloud credentials په checkpoint کې قصداً blank/disabled دي؛ production owner باید خپل publishable configuration جلا configure کړي.
- Phase 14 د deploy artifact correctness تضمینوي؛ دا د حقیقي GitHub account/environment deployment اجرا په دې local container کې نه شي تاییدولی.
- Real Chrome/Edge/Safari/iPhone interaction test لا هم په عادي device/browser کې وروستی external QA دی.

## وروستی QA
- Phase 1 تر Phase 14 ټول regression verifiers: **PASS**
- Production artifact: **80 runtime files / 2,404,565 bytes** (release manifest excludes itself)
- Production HTTP smoke: **81/81 files = 200 OK** (د `release-manifest.json` په ګډون)
- Release manifest size/hash integrity: **PASS**
- Consecutive deterministic build: **PASS**
- Source checkpoint ZIP integrity: **PASS**
- Chromium live probe: container DBus/zygote timeout، `DOM=0`؛ له همدې امله live-browser PASS نه دی اعلان شوی.
