-- Dropship Scout Database Schema (plain Postgres — Neon free tier works great)
--
-- You normally do NOT need to run this by hand: the app creates all tables
-- automatically on first request (see lib/database.ts). This file documents
-- the schema and can be used to set up a database manually.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  shopify_domain text,
  shopify_token_enc text,        -- server-side only, never exposed to client
  created_at timestamptz default now()
);

create table if not exists saved_products (
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
  updated_at timestamptz          -- set by hourly cron refresh
);

create index if not exists saved_products_user_id_idx on saved_products(user_id);

create table if not exists push_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  shopify_product_id text,
  product_name text not null,
  sell_price numeric,
  pushed_at timestamptz default now(),
  status text default 'success',  -- 'success' | 'failed'
  error_message text
);

create index if not exists push_history_user_id_idx on push_history(user_id);

-- One active session per user — restored on login/reload
create table if not exists search_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  platforms text[],
  category text,
  sort_by text,
  custom_niche text,
  results jsonb,
  searched_at timestamptz default now()
);

-- Products from the discovery catalog that a user added to their store catalog
create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_id text not null,          -- id from the curated product dataset
  source text default 'manual',      -- 'manual' | 'ai_builder' | 'suggestion'
  added_at timestamptz default now(),
  pushed_at timestamptz,             -- set when listed on the user's store
  shopify_product_id text,           -- Shopify product id after push
  unique (user_id, product_id)
);

create index if not exists catalog_items_user_id_idx on catalog_items(user_id);
