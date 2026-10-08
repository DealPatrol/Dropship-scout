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
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin for metadata, the sitemap, Open Graph, and Stripe return URLs. Set this to `https://getdropshipscout.com` in production. Falls back to `NEXT_PUBLIC_APP_URL`, then that domain. |
| `CRON_SECRET` | Runtime | Authorizes `/api/cron/track`; the route refuses to run when it is missing. |
| `STRIPE_SECRET_KEY` | Billing | Restricted Stripe server key for Customers, Checkout, and Billing Portal. |
| `STRIPE_PRO_PRICE_ID` | Billing | Recurring Price ID for the monthly Dropship Scout Pro product. |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Optional billing | Recurring yearly Price ID. When set, pricing offers annual checkout with the same Pro limits. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional ads | Meta Pixel id, digits only. Unset means the pixel is not loaded. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional ads | GA4 measurement id (`G-...`). Unset means GA4 is not loaded. |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Optional ads | Google Ads id (`AW-...`). Needs a conversion label to send a conversion. |
| `NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL` | Optional ads | Conversion label for a completed signup. |
| `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL` | Optional ads | Conversion label for a completed idea check. |
| `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` | Optional ads | Conversion label for a Stripe-confirmed Pro purchase. |
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

Vercel Web Analytics is included with `@vercel/analytics`. Enable Web Analytics on the Vercel project. No extra key is required. Signup buttons emit `signup-click`. A successful call that returns a Stripe Checkout URL emits `checkout-started`.

Meta Pixel, GA4, and Google Ads load only when their `NEXT_PUBLIC_` ids are set. Signup fires after an account is created. The idea checker fires a lead after a completed check. Purchase fires only after Stripe Checkout is confirmed and the dashboard claims that conversion once. UTM parameters, `gclid`, and `fbclid` are stored on the user at signup, and filled in on later logins when those columns are empty. `/ads/check-your-product` and `/ads/worth-selling` are noindex landing pages for the checker. They are not in the sitemap.

If Stripe billing keys are missing, signed-in checkout joins the Pro waitlist (`watch_subscribers`, source `pro-waitlist`) instead of returning an error. The app still does not send that email.

Public research pages live under `/research`, with a sample-catalog preview at `/research/preview` and a no-signup product idea checker at `/research/idea-checker`. Those pages do not publish order counts or revenue. The checker uses the default platform fee and card-fee estimate, not live sales. Pro checkout starts from `/pricing` after signup or sign-in (`?plan=pro`, optional `&interval=year`). `POST /api/watch` stores a products-to-watch email in `watch_subscribers`. The app does not send that email.

## Stripe subscriptions

Free accounts can save 10 products, keep 25 research-catalog products, build 10 products at a time, push 3 Shopify products per calendar month, and publish 25 hosted-store listings. Pro removes those limits. Live CJ/Printful/Printify import uses the platform API keys and is available to every signed-in seller; the older discovery adapter for CJ remains Pro-only.

1. In Stripe, create a dedicated **Dropship Scout Pro** Product with a recurring monthly Price. Optionally add a yearly Price on the same product.
2. Set `STRIPE_PRO_PRICE_ID` and a restricted `STRIPE_SECRET_KEY`. Set `STRIPE_PRO_ANNUAL_PRICE_ID` only when the yearly Price exists.
3. Register `POST /api/stripe/webhook` and subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, and `account.updated`. Storefront checkouts and Connect payout status use the same endpoint.
4. Set that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Configure and enable the Stripe Customer Portal.

Webhook signatures are verified and event IDs are stored for idempotency. Stripe Tax is not enabled automatically: before charging customers in a jurisdiction where tax is required, configure registrations and recurring-payment tax collection in Stripe.

## Sales channels

The hosted storefront is the default. **Sales channels** can also connect Shopify and WooCommerce. The token or API key is validated with that platform before it is saved. Sync sends published store listings. Pull imports paid Shopify orders or processing WooCommerce orders into supplier fulfillment.

Those channel orders record the same cost split and do not create a Stripe transfer, because the customer paid the external shop. Import stays paused while `SUPPLIER_ORDERS_MODE=live`, so a channel order cannot bill CJ, Printful, or Printify from the platform wallet. Etsy, eBay, and TikTok Shop are listed as coming soon: their APIs exist, and connecting them needs an approved partner app this deployment does not start.

Research-catalog pushes to Shopify still live on My Catalog and use the same saved Shopify token.

## Shopify setup (optional)

Open **Sales channels**, enter the `myshopify.com` domain, and save a Custom App Admin API token with `write_products`, `read_orders`, and `write_orders`. Dropship Scout calls `shop.json` before encrypting the token. WooCommerce uses an HTTPS store URL and a REST API consumer key with read/write access to products and orders.
