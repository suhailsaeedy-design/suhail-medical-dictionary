# Suhail Medical Dictionary v21.20.0 — Phase 21 راپور

## Phase 21 — Owner Bootstrap & Publish Gate

- Cloud Admin configuration اوس فعال دی، خو authorization لا هم د verified Supabase JWT `app_metadata.smd_role` پر اساس `owner/admin` ته محدود دی.
- `owner-setup.html` private pre-publish route اضافه شو.
- Owner bootstrap code د public source/ZIP برخه نه ده. Supabase private schema کې یوازې SHA-256 hash ساتل کېږي.
- `private.smd_claim_owner()` authenticated Google user غواړي، د دوهم Owner claim مخه نیسي، expiry/used state چک کوي او successful claim وروسته code permanently invalid کوي.
- Claim وروسته cloud session refresh کېږي څو نوی `smd_role=owner` claim په JWT کې راشي.
- Publish Gate د public cloud config، Google session، per-user sync RLS access، Owner role، Admin config او aggregate metrics RPC authorization چک کوي.
- Owner setup route Core Offline Shell کې نه pre-cache کېږي.
- Plaintext bootstrap code repository/production artifact ته نه داخلېږي.

## Security boundary

- Browser کې یوازې publishable Supabase key شته.
- Service-role/secret key نشته.
- Raw cross-user study state او emails Admin UI ته نه ورکول کېږي.
- Owner bootstrap table/function private schema کې دي؛ public wrapper یوازې authenticated callers ته executable دی او token لازمي دی.

## QA

`verify_phase21.py` د source/runtime/production artifact او secret-leak invariants enforce کوي. بشپړ regression نتیجه د checkpoint packaging پر مهال ثبتېږي.


## وروستی QA

- Phase 1–21: PASS
- Production build: 88 manifest runtime files / 2,455,840 bytes
- Local production HTTP smoke: 90/90 URLs = 200 OK
- Plaintext Owner bootstrap code leak scan: source PASS / `_site` PASS
- Supabase Performance Advisor: 0 findings
- Supabase Security Advisor: bootstrap/admin-specific finding نشته؛ یوازې `auth_leaked_password_protection` warning پاتې دی، چې current Google-only login password auth نه کاروي.
- Live bootstrap state: Owner count 0، one unused bootstrap record، anonymous RPC execute = false، authenticated RPC execute = true.
- Bootstrap expiry: 2026-10-21T11:22:49.648458+00:00.
