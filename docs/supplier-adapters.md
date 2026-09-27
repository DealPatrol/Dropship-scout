# Supplier data adapters

`SupplierDataAdapter` in `lib/supplier-data/types.ts` is the boundary between Dropship Scout and supplier catalogs. The app ships with two sources:

- `demo`: the built-in curated catalog. It is always available and is intentionally labeled demo data because its prices, ratings, demand, and supplier availability are editorial estimates.
- `cj`: a live CJ Dropshipping API v2 adapter. It is disabled until `CJ_API_ACCESS_TOKEN` is set and is available only to Pro accounts.

## Configure CJ Dropshipping

1. Create a CJ Dropshipping developer account and obtain an API v2 access token according to CJ's developer portal.
2. Set `CJ_API_ACCESS_TOKEN` as a server-side secret. Never expose it through a `NEXT_PUBLIC_` variable.
3. Leave `CJ_API_BASE_URL` at `https://developers.cjdropshipping.com/api2.0/v1` unless CJ provides a different environment.
4. Request `GET /api/supplier-data?source=cj&query=portable+fan`. The route requires a signed-in Pro account.

The adapter calls CJ's `/product/list` endpoint with the token in the `CJ-Access-Token` header. CJ does not supply every merchandising metric used by Dropship Scout. Missing demand, rating, competition, and trend values are set to neutral/unknown values and must be validated before a listing is published.

## Add another supplier

Implement `SupplierDataAdapter`, add its source ID to `SupplierSourceId`, register it in `getSupplierAdapter` and `listSupplierSources`, and add server-only environment variables to both example env files. Do not silently merge live and demo metrics.
