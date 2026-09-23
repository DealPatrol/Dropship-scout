# Dropship Scout

Next.js 14 dropshipping catalog and merchandising dashboard. Browse the built-in discovery catalog, save products, assemble a catalog, plan seasonal launches, and push listings to Shopify. The product data is curated sample discovery data, not live supplier inventory or verified current sales figures.

## Local setup

Requires Node.js 20+, pnpm, and a Postgres database (Neon works).

1. Create a Postgres database and copy its connection string. The app creates its tables on first use; `schema.sql` documents them.
2. Run `cp .env.local.example .env.local` and set `DATABASE_URL` and `AUTH_SECRET`. Generate the latter with `openssl rand -base64 32`.
3. Run `pnpm install --frozen-lockfile` and `pnpm dev`.
4. Open `http://localhost:3000/auth/sign-up`, create an account, and open the dashboard. Sign in later at `/auth/login`.
5. Run `pnpm build` to check the production build. `pnpm start` serves the built app.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Runtime | Postgres connection string, including Neon SSL parameters. |
| `AUTH_SECRET` | Runtime | Long random signing key for login session cookies. Keep the same value between deployments. |
| `ANTHROPIC_API_KEY` | Optional | Enables AI search and prompt interpretation. Built-in discovery and catalog work without it. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public app URL, such as `http://localhost:3000` locally or the Vercel domain. |
| `CRON_SECRET` | If enabling cron tracking | Authorizes `/api/cron/track`. |

## Vercel deployment

Import this repository into Vercel as a Next.js project. Select pnpm and use `pnpm build`. Set `DATABASE_URL` and `AUTH_SECRET` in Environment Variables for Production and Preview; set `NEXT_PUBLIC_APP_URL` to the public URL. Add `ANTHROPIC_API_KEY` only if you want AI features. Deploy, then visit `/auth/sign-up`. Keep the Postgres URL server-side and use a pooled Neon connection string for serverless functions.

## Shopify setup

After signing in, open Settings and save your shop's domain and a Shopify Admin API access token with product write permission. The token is stored on the server for your account and is not required in a catalog push request. Pushes create Shopify listings; fulfillment, supplier ordering, and inventory synchronization need separate integrations. Check discovery catalog prices and popularity estimates with suppliers before selling.
