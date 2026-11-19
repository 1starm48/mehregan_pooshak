# Persian online shop (scarves & clothing)

Vite + React + Tailwind (RTL, Persian) · Supabase (DB, auth, image storage, Edge Functions) · ZarinPal payments · GitHub Pages hosting. Prices are in Toman.

## 1. Supabase
1. Create a free project at supabase.com.
2. SQL Editor → paste and run `supabase/migrations/001_schema.sql`.
3. Authentication → Providers → Email: turn **off** "Confirm email" (simplest for a start).
4. Sign up once on your site, then make yourself admin (SQL Editor):
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'YOUR@EMAIL');
   ```
5. Project Settings → API: copy the Project URL and `anon` key.

## 2. Payment functions (ZarinPal)
Install the Supabase CLI (`npm i -g supabase`), then:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  ZARINPAL_SANDBOX=true \
  SITE_URL=https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO
supabase functions deploy zarinpal-request
supabase functions deploy zarinpal-verify --no-verify-jwt
```
Test with `ZARINPAL_SANDBOX=true` (any UUID works as merchant id), then set it to `false` with your real merchant id.

## 3. Run locally
Install Node.js 20+, then:
```bash
cp .env.example .env     # fill in the URL and anon key
npm install
npm run dev
```
(For local payment tests set `SITE_URL=http://localhost:5173`.)

## 4. Deploy free on GitHub Pages
1. Push this folder to a GitHub repo (branch `main`).
2. Repo → Settings → Secrets and variables → Actions: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Settings → Pages → Source: **GitHub Actions**. Each push to `main` deploys.

## Using the admin panel
Log in with the admin account → "پنل مدیریت" (`/#/admin`): dashboard, products (with image upload), categories, orders (status + tracking code).
Stock is reduced only after a verified payment. Shipping fee: edit `v_fee` in `create_order()`.
