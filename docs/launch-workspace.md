# Profit-first merchant launch workspace

## Delivered workflow

Dropship Scout is the canonical application. `/dashboard` and `/dashboard/launch` open a merchant workspace; `/launch-preview` is an interactive preview without persistence or paid actions.

1. Select an imported supplier SKU or enter an offer manually.
2. Record audience, stated benefit, source link and merchant-attested supplier/shipping/customer-interest evidence.
3. Calculate contribution after product cost, shipping, payment/platform fees, returns allowance and advertising assumptions. See break-even CAC, target CAC ceiling, ROAS and budget capacity.
4. Review deterministic campaign templates, download CSV/JSON, and optionally create an unpublished store listing from an imported SKU. Existing canonical commerce checks still validate listing price and supplier availability.
5. Enter actual advertising spend, completed orders, gross revenue and refunds. Compare estimated contribution using entered fulfillment costs. Actual refunds replace the planning allowance to avoid double counting.
6. Save and revisit workspaces. Free permits three; the existing $29 Pro plan permits fifty. Capacity is checked while locking the user's account row, preventing concurrent creation from bypassing limits.
7. From Your store, export Shopify draft CSV or an Etsy preparation worksheet. The Etsy worksheet does not claim API publishing.

## Trust and limitations

- Evidence checkboxes are merchant attestations, not independent verification. Sample catalogs remain labeled. Favorable economics alone are not proof of demand.
- Campaign copy uses input-based templates; it does not incur image, video or language-model generation costs.
- Imported SKU costs are not automatically treated as verified shipping quotes. Confirm destination, currency, fees and stock before publishing.
- Experiment totals are manually entered, not ad-account synced. Taxes, fixed overhead, extra return handling, duties and unentered fees are excluded.
- Publishing, fulfillment and payments use the existing commerce routes and require configured provider credentials. This change does not turn supplier live-order mode on.
- Adjacent personalization, semantic search and digital delivery repositories are mapped in `commerce-consolidation.md`; their entire apps are not falsely presented as connected.

## API and persistence

`GET/POST /api/launches` and `GET/PATCH/DELETE /api/launches/[id]` derive ownership from the signed session. Payloads are strictly validated; invalid IDs, JSON, dates, costs and metrics return safe errors. Queries scope every row to the current user. CSV output escapes spreadsheet formulas and quoted text.

`launch_workspaces` and its user index are created idempotently on first authenticated access using the existing database connection. Deployments need the existing `DATABASE_URL` and `AUTH_SECRET`; no new secret is introduced. Verify runtime initialization against the deployed database before asserting persistence is working.

## Commercial validation

Retain the published $29 Pro price rather than silently create new Stripe pricing. Sell the outcome as a profit-first merchandising workspace: know what you can spend to acquire a buyer, prepare an offer, and measure a controlled test. Pricing and positioning are hypotheses, not established demand.

Before calling the product payment-ready, verify signup/login, workspace persistence across sessions, Pro checkout/webhook/entitlement, cancellation, supplier shipping quotes, and a test-mode order through checkout and fulfillment. Do not run paid advertising or supplier orders merely as a software test.
