# Commerce repository consolidation

Audit date: 11 October 2026. This inventory was read from the default branches through GitHub, including directory trees, READMEs, and selected implementation files. It records reuse decisions, not proof that provider credentials or production flows work. Adjacent projects below have not been merged or connected merely by being listed here.

## Product and consolidation decision

Use **DealPatrol/Dropship-scout** as the application and database foundation. Its current main branch already contains persistent Postgres authentication, subscriptions, a hosted seller storefront, cart, checkout, Stripe Connect payouts, supplier imports, order routing, refunds, tracking, and Shopify/WooCommerce listing sync. Preserve those paths and add a merchant decision workflow that helps sellers avoid underpriced products and prepare a controlled product test.

The first paid-value workflow is: **import a supplier SKU → record evidence and landed costs → calculate contribution margin and break-even advertising cost → prepare a listing and launch brief → approve → publish → measure actual orders and cost changes**. A draft brief is useful before expensive media or advertising is purchased. It must not promise sales or confuse editorial sample rankings with measured demand.

## Audited inventory

| Repository | Observed implementation | Consolidation decision |
| --- | --- | --- |
| [Dropship-scout](https://github.com/DealPatrol/Dropship-scout) | Next.js 14 app with `lib/store-db.ts`, `lib/commerce`, supplier gateways, channel adapters, durable auth, billing, and tests. Discovery catalog is curated sample data. | Canonical application. Reuse commerce and supplier structures. Add evidence and economics alongside them. |
| [demandscountai](https://github.com/DealPatrol/demandscountai) | Default branch contains only `README.md`, whose content is the repository name. | Record provenance and its intended demand-research role. There is no demand engine to import. |
| [Etsy-manager](https://github.com/DealPatrol/Etsy-manager) | Static HTML dashboard plus serverless OAuth, auth, analytics, pricing, SEO, forecasting, customer, and reporting endpoints. Selected backend files use process-memory state and mock metrics. | Reuse inventory/edit/bulk/CSV interaction patterns only after checking actual behavior. Rebuild approved Etsy integration against durable seller accounts; do not copy auth or unsupported analytics. |
| [nextjs-commerce](https://github.com/DealPatrol/nextjs-commerce) | Shopify storefront template with product gallery, variants, cart, collections, search, Shopify GraphQL, SEO and revalidation. | Reference storefront design and shopping interactions. Adapt to canonical listing types rather than introduce a second Shopify-only backend. |
| [nextjs-commerces](https://github.com/DealPatrol/nextjs-commerces) | Exact duplicate of the audited commerce root files and subtrees. | Same provenance group; no second runtime. |
| [dogfood](https://github.com/DealPatrol/dogfood) | Exact duplicate of the audited commerce root files and subtrees; no unique pet commerce code in this snapshot. | Same provenance group; do not infer product functionality from its name. |
| [mixedbread-ecommerce-app](https://github.com/DealPatrol/mixedbread-ecommerce-app) | Mixedbread search demo with sample upload, search route, results grid, hooks, and context. | Optional semantic supplier/catalog search pattern. Requires an indexed merchant-appropriate dataset, isolated access and usage limits. Not an order or supplier platform. |
| [mixedbread-starter](https://github.com/DealPatrol/mixedbread-starter) | Same core source subtrees as the other Mixedbread demo; package/lockfile differ. | One search provenance group. Resolve dependencies explicitly if a future integration is chosen. |
| [simple-online-store-with-stripe](https://github.com/DealPatrol/simple-online-store-with-stripe) | Single-product store using embedded Stripe Checkout, local products, and a checkout server action. No fulfillment webhook file in audited tree. | Candidate single-product landing/checkout presentation. Keep existing canonical checkout, authoritative server prices and fulfillment webhook. |
| [wick-and-whisker](https://github.com/DealPatrol/wick-and-whisker) | README describes a local-catalog Next.js store, Stripe Checkout, Printful draft creation and optional Resend mail. Order file writes are best-effort on Vercel and no database is used for v1. | Adjacent physical-product brand and Printful draft pattern. Do not import filesystem order persistence. Not integrated in Dropship Scout by this audit. |
| [pet-keepsakes](https://github.com/DealPatrol/pet-keepsakes) | Tailkept README describes personalized uploads/previews, Stripe, Postgres orders, Blob, 300 DPI rendering and Printify fulfillment/retry. Default tree includes tests and scripts. | Adjacent personalized print-on-demand workflow. Useful future print-area/variant/render patterns; customer uploads, ownership, order metadata and previews need a deliberate schema adapter. Not integrated here. |
| [sellonquay](https://github.com/DealPatrol/sellonquay) | Quay README describes digital storefronts, downloads, bundles, licenses, subscriptions, buyer library, expiring access, affiliates, Stripe and durable database. Its documented stack uses Better Auth and Drizzle. | Adjacent digital-product platform. Candidate digital companion files or bundles in a later phase; requires entitlement/delivery model and explicit payment architecture. Physical supplier fulfillment and digital access are different contracts. Not integrated here. |

## Exact duplicate evidence

For `nextjs-commerce`, `nextjs-commerces`, and `dogfood`, the complete audited root listings had matching paths and SHAs, including:

| Subtree or file | Shared Git object SHA |
| --- | --- |
| `app` | `881aad2b120cf28fd52a5b2f70dd6e7eafe387e2` |
| `components` | `0b90004e6945e65d7b4a96a2794e7aec522f50a1` |
| `lib` | `ff8e3b691b9eeb5bc50ed1679b775f4eb69c5562` |
| `package.json` | `d0ca7fabae211138e66726b920a9db558ff08ec7` |
| `README.md` | `5052aec5ba0ef6805bbcfebfc6cf48de0b584da9` |

For `mixedbread-ecommerce-app` and `mixedbread-starter`, the following source subtrees match exactly. The package manifests and lockfiles differ, so they should not be described as entirely identical repositories.

| Subtree | Shared Git object SHA |
| --- | --- |
| `app` | `fed3ff49fc40d5f6a1cafacdb8e7d1e11c842121` |
| `components` | `4a8a5897ab3107a084179827ea7cc8d96f56b50a` |
| `lib` | `1db9828cb4b97092a93d2008234191129989e3f7` |
| `contexts` | `2e27104b6aec453ba8e9b5179c6e0ca006f6065a` |
| `hooks` | `70c3dbdb01e6f3b309851fec750db95bd53197b8` |

Retain source repositories and license attribution. Consolidating reusable behavior does not require deleting repositories or copying duplicate applications into the product.

## Reuse with boundaries

### Keep the canonical commerce contracts

- Supplier import is implemented in `lib/supplier-api/cj.ts`, `printful.ts`, and `printify.ts`; direct suppliers have their own gateway. This is distinct from the research adapter in `lib/supplier-data`.
- `lib/commerce/listing-price.ts` already assesses viability using supplier cost, estimated payment fees and platform fees. Extend merchant planning to include advertising and a returns reserve rather than replace payout calculations with a second money model.
- `lib/commerce/process-order.ts` routes payments and supplier orders, tracks transfers, compensates refunds, and refreshes tracking. These external effects need provider-backed acceptance tests before production claims.
- `lib/channels/sync.ts` deliberately pauses external Shopify/WooCommerce order import when `SUPPLIER_ORDERS_MODE=live`. Those channels collect money outside this app. Do not advertise live automated supplier fulfillment for their orders until funding, authorization and settlement have been implemented.
- The existing Pro display price is $29/month in `lib/billing.ts`. The configured Stripe Price must match the display. Missing billing keys currently result in a stored waitlist, which is not a paid subscription.

### Do not import Etsy Manager authentication

`api/auth.js` stores users, sessions and rate limits in module-level objects. Serverless instances do not share that state and can lose it on restart. It uses one fixed password salt. Its validate-session/logout paths also follow an unconditional email/password requirement. `api/token.js` caches refresh tokens in process memory and accepts a caller-supplied `userId`; no durable canonical seller identity binding is visible in that handler. These are not suitable production account or token stores.

An Etsy integration should use the existing authenticated account, validate OAuth state and PKCE, bind the callback to that account, encrypt provider tokens in durable storage, refresh server-side, and verify approved scopes and marketplace permissions. Read current official Etsy API requirements before implementing it.

### Do not import fabricated market analytics

Etsy Manager `api/pricing.js` defines fixed market benchmarks, assumed campaign uplifts and fixed bundle sold counts. `api/seo.js` defines mock keyword ranks, clicks, volumes, tag coverage and traffic. `api/analytics.js` uses assumed conversion and monthly divisors rather than a verified time-window/visitor denominator. They cannot support claims about actual market demand, revenue growth or search rankings.

Dropship Scout's `lib/merchandising/data.ts` is an editorial sample dataset, explicitly disclosed in its README. `opportunityScore` now describes sample signals in its reasons, but `revenueImpact` still calculates revenue and confidence from those records. Audit every call site before surfacing that helper. A visible sample scenario must remain labeled; paid insights require provenance and measured inputs.

The research CJ adapter marks demand and ratings unverified but also supplies assumed shipping time, competition and retail multiplier. Live supplier product availability is not evidence of customer demand. Preserve missing values and assumptions instead of upgrading them into verified metrics.

## Remaining integration work

1. **Evidence-backed research:** normalized evidence records with source URL, observation time, geography, metric type and whether each value is measured, estimated, editorial or missing. A pasted source or licensed provider adapter is acceptable; undocumented scraping or fabricated sales is not.
2. **Supplier economics:** destination-specific shipping quote and expiry, currency, SKU/variant/stock mapping, cost change detection, seller advertising input, returns reserve and clear break-even CPA. Explain assumptions and prevent negative/invalid money inputs.
3. **Safe launch agent:** read the seller's evidence and economics, produce a structured draft, store versions and approval state, then call existing publishing paths only under the seller's approval. Keep expenses separate from text drafting. Record actual errors rather than fake success.
4. **Merchant search:** port optional Mixedbread patterns only after defining tenant filters, index ownership, data licensing, rate limits and missing-key behavior. Never expose an unrestricted sample-upload route that spends platform quota.
5. **Etsy:** approved app/scopes, durable OAuth, real shop/listing/order pagination, currency handling, genuine inventory updates and seller-bound credentials. Display unavailable until verified.
6. **Personalized POD:** adapt Tailkept-style uploaded artwork, crop/variant preview, ownership, print-area rendering and fulfillment draft review into the canonical listing/order schema. Existing Printify sync-product imports are not equivalent to this work.
7. **Digital bundles:** adopt selected Quay entitlement patterns only with a deliberate charge model, secure delivery, refunds/access revocation and physical-versus-digital line-item fulfillment. Do not mingle independent databases/auth implementations.
8. **Retention loop:** compare actual paid orders, contribution after refunds, and supplier cost changes against a saved test plan. Report unknown advertising costs as missing, not zero.

## Production acceptance criteria

- Build, lint and relevant auth, billing, money, supplier payload, order, and tenant isolation tests pass on the final branch. This document itself does not report those checks as run.
- A seller can sign up, return later, save supplier data and a decision plan, buy the configured Pro plan in test mode, receive access through a verified webhook, and cancel/manage that plan through the portal.
- Tenant A cannot read or modify Tenant B's plans, listings, orders, provider credentials or uploads. Draft generation and publish approval are enforced server-side.
- Prices are authoritative server-side integer cents; cost, shipping, platform/card fees, ads and returns assumptions are separately visible. Missing costs block confident profit claims.
- Supplier imports use actual configured adapters, record provenance and variant IDs, and render a truthful unconfigured/error state. Sample catalog records never silently become sellable live supplier inventory.
- Hosted test checkout exercises successful fulfillment, supplier rejection/out-of-stock, refund and payout reversal, signature rejection, duplicate webhook, and a failure/retry after supplier creation. Verify no duplicate supplier orders when an order lease expires or a worker crashes.
- Unsupported delayed payment events are either implemented and tested or excluded from checkout payment methods. A paid event is required before any production supplier order.
- Configure and verify production database, billing Price IDs, webhook secrets, Connect account readiness, supplier credentials, email delivery, monitoring, recovery and order support. Keep test/sandbox defaults until authorized live operation.
- Every external channel has a truthful capability label. Etsy/eBay/TikTok Shop and live external-channel fulfillment must not be marked connected or working without the necessary approval and tested implementation.
- Use actual cohort activation, merchant renewal and contribution economics to validate willingness to pay. A feature list, scenario revenue calculation or generated launch draft is not evidence of customers paying.
