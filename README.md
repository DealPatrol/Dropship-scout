# Dropship Scout

Next.js 14 dropshipping app. A seller signs up, imports products from a real supplier, connects Stripe payouts, and publishes a storefront hosted by this app (product pages, cart, and checkout). Shopify remains an optional listing push.

Order routing, supplier sandbox behavior, and the payout split are documented in `docs/commerce.md`.

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
| `SHOPIFY_API_VERSION` | Optional | Shopify Admin API version. The hosted storefront does not use it. |
| `STRIPE_LIVE_MODE` | Optional | Must be `true` together with a live secret key before any live charge or transfer. Default is test mode. |
| `PLATFORM_FEE_BPS` | Optional | Platform fee in basis points of merchandise. Default `500` (5%). |
| `STRIPE_FEE_BPS` | Optional | Estimated card fee used to reject underpriced listings. Default `290`. |
| `STRIPE_FEE_FIXED_CENTS` | Optional | Estimated fixed card fee in cents. Default `30`. Captured orders use Stripe's actual fee. |
| `CONNECT_ACCOUNT_COUNTRY` | Optional | Country for new Express recipient accounts. Default `US`. |
| `SUPPLIER_ORDERS_MODE` | Optional | `sandbox` (default) or `live`. Live places and pays real supplier orders. |
| `PRINTFUL_API_TOKEN` | Optional | Printful private token for catalog import and draft/live orders. |
| `PRINTFUL_STORE_ID` | Optional | Printful store whose sync products can be imported. |
| `PRINTFUL_API_BASE_URL` | Optional | Default `https://api.printful.com`. |
| `PRINTIFY_API_TOKEN` | Optional | Printify personal access token. |
| `PRINTIFY_SHOP_ID` | Optional | Printify shop whose products can be imported. |
| `PRINTIFY_API_BASE_URL` | Optional | Default `https://api.printify.com/v1`. |
| `QUOTE_COUNTRY` | Optional | Country used only for catalog shipping quotes. Default `US`. |
| `QUOTE_REGION` | Optional | Region for catalog shipping quotes. Default `CA`. |
| `QUOTE_CITY` | Optional | City for catalog shipping quotes. |
| `QUOTE_POSTAL_CODE` | Optional | Postal code for catalog shipping quotes. |
| `QUOTE_ADDRESS1` | Optional | Street for catalog shipping quotes. |

## Hosted storefront

1. Sign up at `/auth/sign-up`. No Shopify account is required.
2. Open **Your store**, connect payouts (Stripe Express), and publish a store link at `/store/{slug}`.
3. Open **Suppliers** and import CJ, Printful, or Printify products, or list a product from a direct supplier who joined at **Supplier desk**.
4. Set a retail price that clears supplier cost, estimated card fees, and the platform fee, then publish the listing.
5. A customer checks out with Stripe. The webhook submits the supplier order and transfers the seller's remainder. Direct suppliers also receive their cost. Tracking shows on `/store/{slug}/orders/{token}`.

The built-in discovery catalog is still sample research data and cannot be sold on the storefront. Keep `STRIPE_LIVE_MODE` off and `SUPPLIER_ORDERS_MODE=sandbox` until you intend to move real money. Keys and the human approval steps are listed in `docs/commerce.md`.

## Vercel deployment

Import this repository into Vercel as a Next.js project. Select pnpm and use `pnpm build`. Copy the required values from `.env.example` into sensitive Environment Variables for Production and Preview; do not commit real values. Keep the Postgres URL and all provider keys server-side and use a pooled Neon connection string for serverless functions.

The included hourly cron calls `/api/cron/track`. Set a long random `CRON_SECRET`; Vercel Cron automatically sends it as `Authorization: Bearer <CRON_SECRET>`. Local calls must send the same header. A missing secret returns `503`, not an unprotected successful run.

## Stripe subscriptions

Free accounts can save 10 products, keep 25 research-catalog products, build 10 products at a time, push 3 Shopify products per calendar month, and publish 25 hosted-store listings. Pro removes those limits. Live CJ/Printful/Printify import uses the platform API keys and is available to every signed-in seller; the older discovery adapter for CJ remains Pro-only.

1. In Stripe, create a dedicated **Dropship Scout Pro** Product with a recurring Price.
2. Set `STRIPE_PRO_PRICE_ID` and a restricted `STRIPE_SECRET_KEY`.
3. Register `POST /api/stripe/webhook` and subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, and `account.updated`. Storefront checkouts and Connect payout status use the same endpoint.
4. Set that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Configure and enable the Stripe Customer Portal.

Webhook signatures are verified and event IDs are stored for idempotency. Stripe Tax is not enabled automatically: before charging customers in a jurisdiction where tax is required, configure registrations and recurring-payment tax collection in Stripe.

## Shopify setup (optional)

Shopify is not part of signup, the hosted storefront, or fulfillment. To also push research listings to an existing shop, open Settings and save the shop domain and a Custom App Admin API access token with product write permission. Dropship Scout validates the token before encrypting it at rest. Every push first shows a dry-run preview, validates the connection again, and reports failures per product.
