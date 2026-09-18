# Suhail Medical Dictionary — د Google Login تنظیم

دا نسخه یوازې **Continue with Google** کاروي. کاروونکی زموږ په ویب‌سایټ کې نوی پاسورډ نه جوړوي او خپل Google/Gmail پاسورډ هم زموږ ویب‌سایټ ته نه ورکوي.

## د کاروونکي Data څنګه جلا ساتل کېږي؟

هر Google account چې د Supabase له لارې داخل شي یو ځانګړی `auth.users.id` (UUID) لري. Chats، AI messages، events او profile د همدې `user_id` سره تړل کېږي، نه د خام Email متن سره. نو:

- هماغه Google account = هماغه شخصي data
- بل Google account = جلا data
- Email یوازې د profile د ښودلو لپاره ساتل کېږي

## 1. Supabase Project جوړ کړه

1. Supabase کې Free project جوړ کړه.
2. `SQL Editor` خلاص کړه.
3. د دې پروژې `supabase/schema.sql` ټول Run کړه.
4. `Project Settings / API` کې Project URL او public anon/publishable key پیدا کړه.
5. `assets/js/config.js` کې یې ولیکه.

> `service_role` key هېڅکله Frontend/GitHub ته مه اچوه.

## 2. Google OAuth Client جوړ کړه

Google Cloud / Google Auth Platform کې:

1. یو project جوړ/انتخاب کړه.
2. OAuth consent screen / Branding تنظیم کړه.
3. Audience د خپلې اړتیا مطابق تنظیم کړه.
4. `Clients` کې **Web application** OAuth Client جوړ کړه.
5. Authorized JavaScript origin کې دا ورکړه:

`https://suhailsaeedy-design.github.io`

6. Authorized redirect URI کې د خپل Supabase Project callback ورکړه:

`https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

`YOUR_PROJECT_REF` د خپل Supabase project له URL څخه واخله.

7. Google به Client ID او Client Secret درکړي.

## 3. Google Provider په Supabase کې فعال کړه

Supabase Dashboard کې:

`Authentication → Providers → Google`

- Google Provider فعال کړه.
- Google Client ID ورکړه.
- Google Client Secret ورکړه.
- Save کړه.

## 4. Supabase Redirect URLs

Supabase کې:

`Authentication → URL Configuration`

Site URL:

`https://suhailsaeedy-design.github.io/suhail-medical-dictionary/`

Redirect URLs کې لږ تر لږه دا اضافه کړه:

`https://suhailsaeedy-design.github.io/suhail-medical-dictionary/index.html`

## 5. config.js

`assets/js/config.js` داسې ډک کړه:

```js
export const CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY',
  aiWorkerUrl: '',
  appName: 'Suhail Medical Dictionary',
  meshVersion: '2026',
  autoApplyUpdates: true,
  uiVersion: '6.1.0'
};
```

## 6. Test

1. GitHub ته Push کړه.
2. GitHub Actions شین شي.
3. Website خلاص کړه.
4. `Continue with Google` ووهه.
5. خپل Google account انتخاب کړه.
6. په لومړي Login کې Privacy/Terms یو ځل ومنه.
7. Workspace ته داخلیږي.
8. Logout وکړه او بیا په هماغه Google account داخل شه؛ خپل Chats/Data باید بېرته راشي.

## مهم امنیتي اصل

موږ د Google account پاسورډ نه اخلو. Login د Google او Supabase OAuth ترمنځ ترسره کېږي. د Website frontend کې یوازې Supabase public anon/publishable key کارېږي؛ service-role key باید یوازې Server/Cloudflare Worker Secret کې وي.
