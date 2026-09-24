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
    created_at timestamptz default now()
  )`,
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
    unique (user_id, product_id)
  )`,
  `create index if not exists catalog_items_user_id_idx on catalog_items(user_id)`,
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
