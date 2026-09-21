# Suhail Medical Dictionary v21.18.0 — Cloud Activation & Deployment Guide

دا build په default حالت کې Local/Offline کار کوي. Google/Supabase cloud feature یوازې هغه وخت فعالېږي چې د پروژې مالک خپله Supabase پروژه configure کړي.

## 1. Supabase
1. Supabase project جوړ/انتخاب کړه.
2. Authentication > Providers کې Google فعال کړه.
3. د Google provider Client ID/Client Secret یوازې په Supabase Dashboard کې واچوه؛ دا website repository ته مه اچوه.
4. Authentication URL Configuration کې د deploy شوي سایټ `auth-callback.html` بشپړ URL د Redirect URLs لېست ته اضافه کړه.
5. `supabase/phase7_user_app_state.sql` د SQL Editor له لارې اجرا کړه. دا RLS فعالوي او هر user خپل row ته محدودوي.
6. که Owner/Admin cloud metrics غواړې، `supabase/phase10_admin_metrics.sql` هم اجرا کړه او admin role د server-managed `app_metadata` له لارې تنظیم کړه.

## 2. Browser-safe config
`data/auth-config.json` کې یوازې دا public values ډک کړه:
- `enabled: true`
- `supabaseUrl: https://<project-ref>.supabase.co`
- `publishableKey: <browser-safe publishable key>`
- `sync.enabled: true` که cross-device sync غواړې.

**مه اچوه:** service-role/secret key، database password، Google client secret، OpenAI/API secret.

## 3. Readiness test
Website -> Settings -> Cloud activation readiness -> `Run readiness check`.
دا check:
- config safety
- exact callback URL
- Supabase Auth reachability
- Google provider status
- sync configuration
ګوري.

## 4. Google login test
Readiness PASS وروسته `Connect Google` ووهه. Website باید Google password هېڅکله ونه غواړي؛ password یوازې د Google خپل login page ته ورکول کېږي.

## 5. Deployment
GitHub Pages workflow clean `_site` build جوړوي او یوازې runtime files deploy کوي. Source verifiers، SQL setup files او development reports live site ته نه deploy کېږي.

## Important
دا package حقیقي Supabase URL/key نه لري. ځکه د بلې پروژې credentials اختراع کول یا public ZIP کې secret اچول خوندي نه دي.
