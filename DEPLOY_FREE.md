# Free production deployment

This project is designed so the dictionary can stay useful even when optional free cloud quotas are exhausted.

## Option A — GitHub Pages (easiest static publish)

1. Create a GitHub repository, for example `suhail-medical-dictionary`.
2. Upload the **contents of this project folder** and use `main` as the branch.
3. In GitHub → Settings → Pages, set **Source** to **GitHub Actions**.
4. Push once. `.github/workflows/deploy-pages.yml` automatically:
   - downloads official NLM MeSH 2026 descriptor XML,
   - builds chunked dictionary data,
   - creates a unique release/version stamp,
   - deploys `_site/` to GitHub Pages.
5. Your no-cost URL will look like `https://YOUR-USERNAME.github.io/suhail-medical-dictionary/`.

Every later push builds a new release. Installed PWA copies check for updates and reload to the new version after they reconnect to the internet.

## Option B — Cloudflare Pages

1. Put this project in GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Build command: `python scripts/build_release.py --import-mesh`
4. Build output directory: `_site`
5. Deploy. A no-cost address can look like `https://suhail-medical-dictionary.pages.dev`.

Cloudflare Pages static assets are separate from the optional AI Worker. Keep them as two deployments.

## Enable accounts with Supabase Free

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql` once.
3. Authentication → Providers → Email: keep Email/Password enabled. For a completely free public launch, turn **Confirm email OFF** initially. Supabase's built-in/default email sender is restricted for production delivery; verified-email flows normally require configuring your own SMTP provider. You can turn confirmation back on later when SMTP is ready.
4. From the project's Connect/API area, copy the Project URL and public publishable/anon key into `assets/js/config.js`:

```js
supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY',
```

5. Deploy again.
6. Create your own account from the public site.
7. In Supabase SQL Editor mark only your account as owner:

```sql
update public.profiles set is_owner=true where email='YOUR_OWNER_EMAIL';
```

The service-role key must **not** be added to `config.js`.

## Enable the free AI Worker

1. Cloudflare → Workers & Pages → Create Worker.
2. Use `cloudflare-worker/src/index.js` (or deploy the included Wrangler project).
3. Add a Workers AI binding named exactly `AI`.
4. Add encrypted secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Add `ALLOWED_ORIGINS` as a comma-separated list containing your exact website origins. Example:
   `https://YOUR-USERNAME.github.io,https://suhail-medical-dictionary.pages.dev`
6. Optional variables in `wrangler.toml` default to 30 chat requests and 30 new translation generations per user per day. Lower these if you want stricter free-tier protection.
7. Deploy the Worker and copy its HTTPS URL into `assets/js/config.js` as `aiWorkerUrl`.
8. Deploy the static site again.

## Offline use

A student opens the site online once, presses **Download complete offline dictionary**, and waits for 100%. The app caches the search index and every generated MeSH data chunk. It can then be installed to the home screen/desktop.

When the website changes, the production build stamps a new version. Connected copies check on start, when returning to the foreground, when the network reconnects, and periodically while open. A fully offline device cannot receive a server update until it reconnects.

## Free-tier reality

No third-party provider can guarantee unlimited AI, database, and authentication capacity forever at $0. The project is therefore **free-first** rather than pretending to be infinitely free: the static dictionary can remain free and offline, while AI/account features stop gracefully when a provider quota is exhausted. Do not add a payment method unless you intentionally want paid scaling.

## Full-data and multilingual behavior

The production build imports the official MeSH 2026 **descriptor** vocabulary. MeSH is broad but not literally every medical term in existence.

English NLM definitions are available immediately. For Pashto, Dari, Persian, Turkish, Arabic, and Chinese, missing translations use the optional AI Worker on demand. A generated translation is cached in Supabase for reuse and locally in IndexedDB after viewing. AI-assisted translations are marked as needing medical review.

## Before public launch

- Confirm `privacy.html` and `terms.html` match your actual practices.
- Keep owner chat review opt-in; do not secretly inspect private chat content.
- Test signup, logout, separate accounts, owner dashboard, offline download, PWA install, update after a new deploy, and AI quota errors.
- Keep NLM attribution visible.

## Source-code visibility

GitHub Pages on a GitHub Free personal account normally requires the repository to be public, so the repository source can be viewed and forked by anyone. Public visibility does not grant write access to the original repository. Only the owner and explicitly added collaborators can push changes. If source-code privacy is preferred, Cloudflare Pages supports Git integration with both private and public GitHub repositories; move the repository back to private only after the Cloudflare deployment is working.
