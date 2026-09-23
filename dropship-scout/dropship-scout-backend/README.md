# DropShip Scout — Backend Setup Guide

## What this backend does

| Feature | How |
|---|---|
| AI product search | Server-side Anthropic call — your API key never hits the browser |
| Save products | Supabase Postgres — persists across sessions |
| Push to Shopify | Server-side Shopify API call — your token never hits the browser |
| Credentials storage | Shopify domain + token stored securely in Supabase |
| Push history | Every product push logged with status |
| Session restore | Last search results reload when you reopen the app |

---

## Step 1 — Create a Supabase project (free)

1. Go to **https://supabase.com** → Sign up / Log in
2. Click **New Project** → name it `dropship-scout`
3. Choose a region close to you → click **Create new project**
4. Wait ~2 minutes for it to boot up
5. Go to **SQL Editor** (left sidebar) → **New query**
6. Open `supabase-schema.sql` from this folder, paste the entire contents, click **Run**
7. You should see "Success. No rows returned."

---

## Step 2 — Get your Supabase API keys

1. In your Supabase project → **Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → this is `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep this secret

---

## Step 3 — Get your Anthropic API key

1. Go to **https://console.anthropic.com** → API Keys
2. Create a new key → copy it
3. This is `ANTHROPIC_API_KEY`

---

## Step 4 — Set up environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in all 4 values in `.env.local`.

---

## Step 5 — Run locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — you should see the app.

---

## Step 6 — Deploy to Vercel (free)

1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "DropShip Scout backend"
   gh repo create dropship-scout --public --push
   ```

2. Go to **https://vercel.com** → **Add New Project** → Import your repo

3. In Vercel's **Environment Variables** section, add all 4 variables from your `.env.local`

4. Click **Deploy** — done! Vercel gives you a live URL.

---

## API Routes Summary

| Route | Method | What it does |
|---|---|---|
| `/api/products/search` | POST | AI product search |
| `/api/products/saved` | GET | Get saved products |
| `/api/products/saved` | POST | Save a product |
| `/api/products/saved` | DELETE | Remove saved product |
| `/api/shopify/push` | POST | Push products to Shopify |
| `/api/shopify/credentials` | GET | Get saved Shopify domain |
| `/api/shopify/credentials` | POST | Save Shopify domain + token |
| `/api/shopify/credentials` | DELETE | Clear credentials |
| `/api/shopify/history` | GET | Push history log |
| `/api/auth/session` | GET | Restore last search session |

---

## Connecting the frontend

In your React app (`dropship-scout.jsx`), replace the direct `fetch` calls with the helpers from `lib/api.ts`:

```js
// Instead of calling Anthropic directly:
import { searchProducts } from '@/lib/api'
const products = await searchProducts({ platforms, category, sortBy, customNiche, userId })

// Instead of calling Shopify directly from the browser:
import { pushToShopify } from '@/lib/api'
const result = await pushToShopify({ domain, token, products, userId })
```

The frontend sends requests to **your own backend** — all secrets stay server-side.
