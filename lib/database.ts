// lib/database.ts
// Postgres client (works with Neon's free tier, or any Postgres) plus
// idempotent schema initialization, so setup is just: set DATABASE_URL.

import postgres from 'postgres'

declare global {
  // Reuse the connection and the schema-init promise across hot reloads
  // and serverless invocations within the same runtime.
  // eslint-disable-next-line no-var
  var __dropshipSql: ReturnType<typeof postgres> | undefined
  // eslint-disable-next-line no-var
  var __dropshipSchemaReady: Promise<void> | undefined
}

function createClient() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Missing required environment variable: DATABASE_URL')
  }
  return postgres(url, {
    ssl: url.includes('localhost') || url.includes('127.0.0.1') ? undefined : 'require',
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
  })
}

/**
 * Returns the shared Postgres client, creating (and caching) it on first use.
 * Deferring creation keeps `next build`'s page-data collection from requiring
 * DATABASE_URL at import time — the client is only built when a query runs.
 */
function getSql(): ReturnType<typeof postgres> {
  return globalThis.__dropshipSql ?? (globalThis.__dropshipSql = createClient())
}

// A lazy proxy so `import { sql }` doesn't instantiate the client at module
// load. It behaves exactly like the postgres client: callable as a tagged
// template (`sql\`...\``) and exposing methods like `sql.unsafe`/`sql.json`.
export const sql: ReturnType<typeof postgres> = new Proxy(
  function () {} as unknown as ReturnType<typeof postgres>,
  {
    apply(_target, _thisArg, args: unknown[]) {
      return (getSql() as unknown as (...a: unknown[]) => unknown)(...args)
    },
    get(_target, prop, receiver) {
      const client = getSql()
      const value = Reflect.get(client as object, prop, receiver)
      return typeof value === 'function' ? value.bind(client) : value
    },
  }
)

const SCHEMA_STATEMENTS = [
  `create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    password_hash text not null,
    shopify_domain text,
    shopify_token_enc text,
    plan text not null default 'free',
    stripe_customer_id text unique,
    stripe_subscription_id text unique,
    stripe_subscription_status text,
    stripe_event_created bigint not null default 0,
    created_at timestamptz default now()
  )`,
  `alter table users add column if not exists plan text not null default 'free'`,
  `alter table users add column if not exists stripe_customer_id text unique`,
  `alter table users add column if not exists stripe_subscription_id text unique`,
  `alter table users add column if not exists stripe_subscription_status text`,
  `alter table users add column if not exists stripe_event_created bigint not null default 0`,
  `create table if not exists saved_products (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    name text not null,
    category text,
    trend text,
    margin numeric,
    sell_price numeric,
    source_price numeric,
    monthly_sales text,
    rating numeric,
    competition text,
    score numeric,
    platforms text[],
    tags text[],
    ai_insight text,
    image_url text,
    saved_at timestamptz default now(),
    updated_at timestamptz
  )`,
  `create index if not exists saved_products_user_id_idx on saved_products(user_id)`,
  `create table if not exists push_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    shopify_product_id text,
    product_name text not null,
    sell_price numeric,
    pushed_at timestamptz default now(),
    status text default 'success',
    error_message text
  )`,
  `create index if not exists push_history_user_id_idx on push_history(user_id)`,
  `create table if not exists search_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade unique,
    platforms text[],
    category text,
    sort_by text,
    custom_niche text,
    results jsonb,
    searched_at timestamptz default now()
  )`,
  `create table if not exists catalog_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    product_id text not null,
    source text default 'manual',
    added_at timestamptz default now(),
    pushed_at timestamptz,
    shopify_product_id text,
    shopify_domain text,
    unique (user_id, product_id)
  )`,
  `alter table catalog_items add column if not exists shopify_domain text`,
  `create index if not exists catalog_items_user_id_idx on catalog_items(user_id)`,
  `create table if not exists stripe_events (
    event_id text primary key,
    event_type text not null,
    processed_at timestamptz default now()
  )`,
  `create table if not exists usage_counters (
    user_id uuid references users(id) on delete cascade,
    usage_key text not null,
    period_start date not null,
    count integer not null default 0,
    primary key (user_id, usage_key, period_start)
  )`,
  `create table if not exists shopify_push_operations (
    user_id uuid references users(id) on delete cascade,
    operation_key text not null,
    status text not null default 'pending',
    shopify_product_id text,
    error_message text,
    reserved boolean not null default false,
    updated_at timestamptz not null default now(),
    primary key (user_id, operation_key)
  )`,
  `alter table users add column if not exists store_slug text`,
  `alter table users add column if not exists store_name text`,
  `alter table users add column if not exists store_published boolean not null default false`,
  `alter table users add column if not exists stripe_account_id text`,
  `alter table users add column if not exists connect_transfers_status text`,
  `create unique index if not exists users_store_slug_uidx on users (store_slug) where store_slug is not null`,
  `create unique index if not exists users_stripe_account_uidx on users (stripe_account_id) where stripe_account_id is not null`,
  `create table if not exists supplier_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid unique references users(id) on delete cascade,
    display_name text not null,
    slug text unique not null,
    notify_url text,
    status text not null default 'active',
    created_at timestamptz default now()
  )`,
  `create table if not exists supplier_products (
    id uuid primary key default gen_random_uuid(),
    provider text not null,
    external_id text not null,
    variant_id text not null,
    supplier_profile_id uuid references supplier_profiles(id) on delete cascade,
    title text not null,
    description text,
    image_url text,
    cost_cents integer not null,
    shipping_cents integer not null default 0,
    currency text not null default 'usd',
    sku text,
    stock integer,
    available boolean not null default true,
    raw jsonb,
    updated_at timestamptz default now(),
    unique (provider, external_id, variant_id)
  )`,
  `create index if not exists supplier_products_provider_idx on supplier_products(provider)`,
  `create index if not exists supplier_products_profile_idx on supplier_products(supplier_profile_id)`,
  `create table if not exists store_listings (
    id uuid primary key default gen_random_uuid(),
    seller_user_id uuid not null references users(id) on delete cascade,
    supplier_product_id uuid not null references supplier_products(id),
    title text not null,
    description text,
    price_cents integer not null,
    slug text not null,
    published boolean not null default false,
    created_at timestamptz default now(),
    unique (seller_user_id, supplier_product_id),
    unique (seller_user_id, slug)
  )`,
  `create index if not exists store_listings_seller_idx on store_listings(seller_user_id)`,
  `create table if not exists store_orders (
    id uuid primary key default gen_random_uuid(),
    seller_user_id uuid not null references users(id),
    public_token text unique not null,
    status text not null,
    customer_email text,
    customer_name text,
    shipping_address jsonb,
    currency text not null default 'usd',
    merchandise_cents integer not null,
    shipping_cents integer not null,
    gross_cents integer not null,
    stripe_fee_cents integer,
    platform_fee_cents integer,
    supplier_cost_cents integer,
    seller_transfer_cents integer,
    supplier_transfer_cents integer,
    stripe_checkout_session_id text unique,
    stripe_payment_intent_id text,
    stripe_charge_id text,
    failure_reason text,
    sandbox boolean not null default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )`,
  `create index if not exists store_orders_seller_idx on store_orders(seller_user_id)`,
  `create table if not exists store_order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references store_orders(id) on delete cascade,
    listing_id uuid references store_listings(id),
    supplier_product_id uuid references supplier_products(id),
    provider text not null,
    supplier_profile_id uuid,
    title text not null,
    quantity integer not null,
    unit_price_cents integer not null,
    unit_cost_cents integer not null,
    unit_shipping_cents integer not null,
    external_product_id text not null,
    external_variant_id text not null
  )`,
  `create table if not exists fulfillment_jobs (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references store_orders(id) on delete cascade,
    group_key text not null,
    provider text not null,
    supplier_profile_id uuid,
    external_order_id text,
    status text not null,
    tracking_number text,
    tracking_url text,
    carrier text,
    sandbox boolean not null default true,
    error text,
    updated_at timestamptz default now(),
    unique (order_id, group_key)
  )`,
  `create table if not exists payout_transfers (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references store_orders(id) on delete cascade,
    role text not null,
    group_key text,
    stripe_account_id text not null,
    amount_cents integer not null,
    stripe_transfer_id text,
    reversal_id text,
    status text not null,
    error text,
    created_at timestamptz default now()
  )`,
  `create table if not exists supplier_notifications (
    id uuid primary key default gen_random_uuid(),
    supplier_profile_id uuid not null references supplier_profiles(id) on delete cascade,
    order_id uuid references store_orders(id) on delete cascade,
    kind text not null,
    message text not null,
    read_at timestamptz,
    created_at timestamptz default now()
  )`,
]

async function initSchema(): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await sql.unsafe(statement)
  }
}

/** Ensures all tables exist. Runs once per runtime; call before queries. */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__dropshipSchemaReady) {
    globalThis.__dropshipSchemaReady = initSchema().catch(err => {
      globalThis.__dropshipSchemaReady = undefined
      throw err
    })
  }
  return globalThis.__dropshipSchemaReady
}
