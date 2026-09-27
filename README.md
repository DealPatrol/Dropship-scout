# Dropship Scout

Next.js 14 dropshipping catalog and merchandising dashboard. Browse products, save them, assemble a catalog, plan seasonal launches, and preview/push listings to Shopify.

> **Demo source:** the built-in discovery catalog is curated sample data. Its prices, demand, ratings, sales, and supplier availability are not live or verified. Live sources use the adapter interface in `lib/supplier-data`; the optional CJ Dropshipping adapter is documented in `docs/supplier-adapters.md`.

## Local setup

Requires Node.js 22.14+, pnpm, and a Postgres database (Neon works).

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
| `CRON_SECRET` | Runtime | Authorizes `/api/cron/track`; the route refuses to run when it is missing. |
| `STRIPE_SECRET_KEY` | Billing | Restricted Stripe server key for Customers, Checkout, and Billing Portal. |
| `STRIPE_PRO_PRICE_ID` | Billing | Recurring Price ID for the separate Dropship Scout Pro product. |
| `STRIPE_WEBHOOK_SECRET` | Billing | Signing secret for `/api/stripe/webhook`. |
| `CJ_API_ACCESS_TOKEN` | Optional, Pro | Enables the live CJ Dropshipping supplier adapter. |
| `CJ_API_BASE_URL` | Optional | CJ API v2 base URL; normally keep the documented default. |
| `SHOPIFY_API_VERSION` | Recommended | Shopify Admin API version used for validation and product creation. |

## Vercel deployment

Import this repository into Vercel as a Next.js project. Select pnpm and use `pnpm build`. Copy the required values from `.env.example` into sensitive Environment Variables for Production and Preview; do not commit real values. Keep the Postgres URL and all provider keys server-side and use a pooled Neon connection string for serverless functions.

The included hourly cron calls `/api/cron/track`. Set a long random `CRON_SECRET`; Vercel Cron automatically sends it as `Authorization: Bearer <CRON_SECRET>`. Local calls must send the same header. A missing secret returns `503`, not an unprotected successful run.

## Stripe subscriptions

Free accounts can save 10 products, keep 25 catalog products, build 10 products at a time, and push 3 Shopify products per calendar month. Pro removes those limits and enables live supplier adapters.

1. In Stripe, create a dedicated **Dropship Scout Pro** Product with a recurring Price.
2. Set `STRIPE_PRO_PRICE_ID` and a restricted `STRIPE_SECRET_KEY`.
3. Register `POST /api/stripe/webhook` and subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
4. Set that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Configure and enable the Stripe Customer Portal.

Webhook signatures are verified and event IDs are stored for idempotency. Stripe Tax is not enabled automatically: before charging customers in a jurisdiction where tax is required, configure registrations and recurring-payment tax collection in Stripe.

## Shopify setup

After signing in, open Settings and save your shop's domain and a Custom App Admin API access token with product write permission. Dropship Scout validates the token before encrypting it at rest. Every push first shows a dry-run preview, validates the connection again, and reports failures per product. Pushes create Shopify listings; fulfillment, supplier ordering, and inventory synchronization need separate integrations. Verify every demo or supplier metric before selling.
