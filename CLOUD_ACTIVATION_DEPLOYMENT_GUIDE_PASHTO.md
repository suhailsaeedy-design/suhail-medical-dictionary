# Suhail Medical Dictionary v21.20.0 — Live Cloud & Deployment Guide

دا build له connected **Suhail Medical Dictionary** Supabase project سره live configured دی. Google Auth او per-user cloud sync فعال دي؛ Local/Offline core بیا هم د cloud session پرته کار کوي.

## اوسنی live config
- Supabase project URL: `https://qdfylefkkkyjwtqqiuye.supabase.co`
- Production site: `https://suhailsaeedy-design.github.io/suhail-medical-dictionary/`
- Callback: `https://suhailsaeedy-design.github.io/suhail-medical-dictionary/auth-callback.html`
- Browser config یوازې publishable key لري؛ service-role/secret key نشته.
- Sync table: `public.user_app_state`
- RLS: هر authenticated user یوازې خپل row لیدلی/بدلولی شي.

## د Publish مخکې لازمي Dashboard check
Supabase Dashboard -> Authentication -> URL Configuration کې پورته exact callback URL د Redirect URLs لېست کې موجود کړه. Connector د دې allow-list د edit action نه لري، نو دا یو Dashboard-side check دی.

## Google provider
Google provider په connected project کې فعال دی. Google Client Secret یوازې Supabase Dashboard/Google console کې وساته؛ website repository ته یې مه اچوه.

## Database
`supabase/phase20_preproduction_cleanup.sql` current canonical/idempotent pre-production schema ده. دا legacy v20 cloud tables/RPCs لرې کوي او `user_app_state` + protected aggregate admin metrics ساتي.

## Owner/Admin
Cloud Admin لا disabled دی. Owner/Admin role باید په قصد server-side `app_metadata.smd_role` کې `owner` یا `admin` وټاکل شي. د موجود Google users له منځه owner په اټکل مه ټاکه.

## Cloud AI
Cloud AI جلا optional feature دی او لا disabled/blank دی. Local Study Engine offline کار کوي.

## Security
هیڅکله browser files ته service-role key، database password، Google client secret یا بل secret مه اچوه.


## Owner Bootstrap / Admin activation

`owner-setup.html` یوه private pre-publish route ده. د Owner code plaintext په repository کې نه ساتل کېږي؛ Supabase کې یوازې hash ساتل کېږي. د Google account له verify کېدو وروسته code یو ځل استعمالېږي، JWT refresh کېږي او `app_metadata.smd_role=owner` تاییدېږي. د code له استعمال وروسته هغه بیا کار نه کوي.
