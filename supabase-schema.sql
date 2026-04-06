-- DropShip Scout Database Schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Extends Supabase's built-in auth.users table with app-specific fields

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  shopify_domain text,
  shopify_token_enc text,       -- server-side only, never exposed to client
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ─── Saved Products ──────────────────────────────────────────────────────────

create table if not exists public.saved_products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
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

alter table public.saved_products enable row level security;

create policy "Users can manage own saved products"
  on public.saved_products for all using (auth.uid() = user_id);

create index saved_products_user_id_idx on public.saved_products(user_id);

-- ─── Push History ────────────────────────────────────────────────────────────

create table if not exists public.push_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  shopify_product_id text,
  product_name text not null,
  sell_price numeric,
  pushed_at timestamptz default now(),
  status text default 'success',  -- 'success' | 'failed'
  error_message text
);

alter table public.push_history enable row level security;

create policy "Users can view own push history"
  on public.push_history for all using (auth.uid() = user_id);

create index push_history_user_id_idx on public.push_history(user_id);

-- ─── Search Sessions ─────────────────────────────────────────────────────────
-- One active session per user — restored on login/reload

create table if not exists public.search_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  platforms text[],
  category text,
  sort_by text,
  custom_niche text,
  results jsonb,
  searched_at timestamptz default now()
);

alter table public.search_sessions enable row level security;

create policy "Users can manage own search session"
  on public.search_sessions for all using (auth.uid() = user_id);
