# Hosted storefront, suppliers, and payouts

Sellers do not need Shopify. They sign up in Dropship Scout, connect a Stripe Express account, import products that a supplier can actually fulfill, and publish `/store/{slug}`. Checkout is Stripe Checkout on the platform account. After payment, the app submits the supplier order and splits the charge.

Shopify credentials in Settings remain an optional way to push research listings. Nothing in signup, catalog import, checkout, or fulfillment reads them.

## Which suppliers

| Supplier | Why it is included | What “real” means here | Sandbox default |
| --- | --- | --- | --- |
| CJ Dropshipping | Public API v2 for catalog, stock, freight, order create, and tracking. Already used for product search. | Import uses `/product/list`, `/product/variant/query`, `/product/stock/queryByVid`, and `/logistic/freightCalculate`. Orders use `POST /shopping/order/createOrderV3`. | `isSandbox: 1` and `payType: 3`. CJ documents this as a simulated payment: no real charge, logistics, or fulfillment. |
| Printful | Public API for print-on-demand. Orders can be created as drafts and are not charged until confirmed. | Import reads **sync products already created in the platform Printful store** (`GET /store/products`), then the catalog variant cost and a shipping-rate quote. Blank catalog products are not imported, because they cannot be ordered without a design file. | `POST /orders` with `confirm: false`. Live mode sends `confirm: true`, which bills the Printful account. |
| Printify | Public API for print-on-demand. Orders stay on hold until `send_to_production`. | Import reads products in the platform Printify shop (`GET /shops/{id}/products.json`) and a shipping quote. Variant `cost` is the production cost in cents. | `POST /orders.json` only. Live mode also calls `send_to_production`. |
| Direct supplier | An independent supplier onboards on this platform. | They create their own products, stock, cost, and shipping. Orders land in **Supplier desk** and, if set, POST to their HTTPS notify URL. | No external API. Stock is decremented in Postgres and restored if the order is cancelled. |

The discovery `demo` adapter is unchanged and is not a sellable provider. A listing must point at a `supplier_products` row from one of the four sources above.

`SUPPLIER_ORDERS_MODE=live` is the only switch that pays CJ from its wallet (`payType: 2`), confirms a Printful order, or sends a Printify order to production.

## Payout split

One customer payment can pay a seller and a direct supplier, so the charge pattern is **separate charges and transfers**. Destination charges only have one destination. `application_fee_amount` is not used with this pattern; the platform keeps its fee by transferring less than the charge.

Connected accounts (sellers and direct suppliers) are Accounts v2 recipient accounts:

- `dashboard: "express"`
- `configuration.recipient.capabilities.stripe_balance.stripe_transfers`
- `fees_collector: "application"`
- `losses_collector: "application"`

The platform is the merchant of record. A transfer is created only after the supplier accepts the order, and only if the seller's remainder is zero or positive.

```
platform fee   = round(merchandise × PLATFORM_FEE_BPS / 10000)
seller transfer = charge − Stripe fee − supplier cost − platform fee
```

Supplier cost is product cost plus shipping.

- **CJ, Printful, Printify** bill the platform account. Their cost is not transferred. It stays on the platform balance so the platform can pay that supplier invoice. The seller transfer is the remainder.
- **Direct suppliers** receive a Connect transfer for their cost, using the charge as `source_transaction`. The seller receives a second transfer for the remainder.

Listing prices are rejected when an estimated card fee (default 2.9% + $0.30) would make the seller transfer negative. The webhook replaces that estimate with the PaymentIntent's balance-transaction fee. If the real fee or the supplier's reported cost makes the split impossible, the customer is refunded and no transfer is created.

Failures:

- Supplier rejection or out of stock: cancel any supplier order already accepted, refund the PaymentIntent, do not transfer.
- Transfer failure: reverse transfers already created, cancel supplier orders, refund.
- Later refund (`charge.refunded` or the seller's Refund button): reverse remaining transfers and cancel supplier orders. Direct-supplier stock is restored once.

Tracking is polled hourly by `/api/cron/track` for CJ, Printful, and Printify. Direct suppliers enter a tracking number on Supplier desk. The customer order page is `/store/{slug}/orders/{token}`. This app has no email provider, so that page is how the customer sees status and tracking. A direct supplier can also set an HTTPS notify URL.

## Environment variables Cole needs

Set these in Vercel for project `dropship-scout` (Production and Preview). Keep test and sandbox values until a deliberate launch.

| Variable | Where to get it |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys. Use a **test** restricted key (`rk_test_…`). It needs Checkout, PaymentIntents, refunds, Transfers, Customers, and Accounts v2. The existing Pro billing price still uses this key. |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → `POST /api/stripe/webhook`. Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, and `account.updated`. |
| `STRIPE_LIVE_MODE` | Leave unset or `false`. Set `true` only together with a live key. |
| `PLATFORM_FEE_BPS` | Your choice. Default `500` (5% of merchandise). |
| `CONNECT_ACCOUNT_COUNTRY` | Default `US`. |
| `CJ_API_ACCESS_TOKEN` | [CJ API](https://developers.cjdropshipping.com/en/api/api2/). Create an API key, then exchange it for an access token (`/authentication/getAccessToken`). Header name is `CJ-Access-Token`. |
| `CJ_API_BASE_URL` | `https://developers.cjdropshipping.com/api2.0/v1` unless CJ gives you another host. |
| `PRINTFUL_API_TOKEN` | [Printful API tokens](https://developers.printful.com/docs/). Private token from the Printful dashboard. |
| `PRINTFUL_STORE_ID` | Printful dashboard store id, or `GET /stores`. The store needs at least one sync product with a design. |
| `PRINTIFY_API_TOKEN` | [Printify API](https://developers.printify.com/) → account API → personal access token with `shops.read`, `products.read`, `orders.read`, `orders.write`. |
| `PRINTIFY_SHOP_ID` | `GET https://api.printify.com/v1/shops.json`. The shop needs at least one product. |
| `SUPPLIER_ORDERS_MODE` | `sandbox` until you want real supplier charges. |

`STRIPE_FEE_BPS`, `STRIPE_FEE_FIXED_CENTS`, `QUOTE_*`, and the `*_API_BASE_URL` overrides have defaults. They are listed in `.env.example`.

## What still needs a person

- Turn on **Stripe Connect** for the platform in test mode and finish the platform profile. Accounts v2 has to be available on that account. Sellers and direct suppliers then complete Express onboarding with Stripe's test data (test phone, test bank, document uploads Stripe accepts in test mode). Transfers stay `pending` until `stripe_transfers` is `active`.
- CJ may require an approved seller account before it issues an API token. The token is a platform secret, not a per-seller secret.
- Printful and Printify imports return nothing until those platform accounts contain real products. Creating the first designed product is a manual step in their dashboards.
- Do not set `STRIPE_LIVE_MODE=true` or `SUPPLIER_ORDERS_MODE=live` until Connect, supplier wallets, and refunds have been tried in test/sandbox.
- Customer email is not sent. Add an email provider later if you want tracking messages beyond the order page.
