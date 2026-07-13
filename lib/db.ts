// lib/db.ts
// All database queries in one place — plain SQL against Postgres.

import { ensureSchema, sql } from './database'
import type { Product } from './types'

// ─── Users / Shopify credentials ─────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  await ensureSchema()
  const rows = await sql`select id, email, shopify_domain, created_at from users where id = ${userId}`
  return rows[0] ?? null
}

export async function getShopifyDomain(userId: string): Promise<string | null> {
  await ensureSchema()
  const rows = await sql`select shopify_domain from users where id = ${userId}`
  return rows[0]?.shopify_domain ?? null
}

export async function saveShopifyCredentials(userId: string, domain: string, token: string | null) {
  await ensureSchema()
  if (token) {
    await sql`update users set shopify_domain = ${domain}, shopify_token_enc = ${token} where id = ${userId}`
  } else {
    await sql`update users set shopify_domain = ${domain} where id = ${userId}`
  }
}

export async function clearShopifyCredentials(userId: string) {
  await ensureSchema()
  await sql`update users set shopify_domain = null, shopify_token_enc = null where id = ${userId}`
}

export async function getShopifyCredentials(
  userId: string
): Promise<{ domain: string; token: string } | null> {
  await ensureSchema()
  const rows = await sql`select shopify_domain, shopify_token_enc from users where id = ${userId}`
  const row = rows[0]
  if (!row?.shopify_domain || !row?.shopify_token_enc) return null
  return { domain: row.shopify_domain, token: row.shopify_token_enc }
}

// ─── Saved products ──────────────────────────────────────────────────────────

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category ?? ''),
    trend: row.trend as Product['trend'],
    margin: Number(row.margin ?? 0),
    sellPrice: String(row.sell_price ?? '0'),
    sourcePrice: String(row.source_price ?? '0'),
    monthlySales: String(row.monthly_sales ?? ''),
    rating: Number(row.rating ?? 0),
    competition: row.competition as Product['competition'],
    score: Number(row.score ?? 0),
    platforms: (row.platforms as Product['platforms']) ?? [],
    tags: (row.tags as string[]) ?? [],
    aiInsight: String(row.ai_insight ?? ''),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    savedAt: row.saved_at ? String(row.saved_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  }
}

export async function getSavedProducts(userId: string): Promise<Product[]> {
  await ensureSchema()
  const rows = await sql`
    select * from saved_products where user_id = ${userId} order by saved_at desc
  `
  return rows.map(rowToProduct)
}

export async function getSavedProductRows(userId: string) {
  await ensureSchema()
  return sql`select * from saved_products where user_id = ${userId} order by score desc`
}

export async function insertSavedProduct(userId: string, product: Product): Promise<string> {
  await ensureSchema()
  const rows = await sql`
    insert into saved_products (
      user_id, name, category, trend, margin, sell_price, source_price,
      monthly_sales, rating, competition, score, platforms, tags, ai_insight, image_url
    ) values (
      ${userId}, ${product.name}, ${product.category}, ${product.trend},
      ${product.margin}, ${parseFloat(product.sellPrice)}, ${parseFloat(product.sourcePrice)},
      ${product.monthlySales}, ${product.rating}, ${product.competition}, ${product.score},
      ${product.platforms}, ${product.tags}, ${product.aiInsight}, ${product.imageUrl || ''}
    ) returning id
  `
  return rows[0].id
}

export async function deleteSavedProduct(userId: string, id: string) {
  await ensureSchema()
  await sql`delete from saved_products where id = ${id} and user_id = ${userId}`
}

export async function getTrackedProducts(userId: string) {
  await ensureSchema()
  return sql`
    select id, name, category, score, trend, updated_at
    from saved_products where user_id = ${userId} order by saved_at desc
  `
}

export async function getStaleTrackedProducts(sinceDays: number, refreshedBeforeMinutes: number) {
  await ensureSchema()
  return sql`
    select id, name, category, score from saved_products
    where saved_at >= now() - make_interval(days => ${sinceDays})
      and (updated_at is null or updated_at < now() - make_interval(mins => ${refreshedBeforeMinutes}))
    limit 20
  `
}

export async function getSavedProductsForSync(userId: string, productIds?: string[]) {
  await ensureSchema()
  if (productIds?.length) {
    return sql`
      select id, name, category, score, trend, sell_price, source_price, platforms, margin
      from saved_products where user_id = ${userId} and id = any(${productIds}) limit 20
    `
  }
  return sql`
    select id, name, category, score, trend, sell_price, source_price, platforms, margin
    from saved_products where user_id = ${userId} limit 20
  `
}

export async function updateProductTracking(
  id: string,
  updates: { score?: number; trend?: string; ai_insight?: string; margin?: number }
) {
  await ensureSchema()
  await sql`
    update saved_products
    set updated_at = now(),
        score = coalesce(${updates.score ?? null}, score),
        trend = coalesce(${updates.trend ?? null}, trend),
        ai_insight = coalesce(${updates.ai_insight ?? null}, ai_insight),
        margin = coalesce(${updates.margin ?? null}, margin)
    where id = ${id}
  `
}

// ─── Push history ────────────────────────────────────────────────────────────

export async function logPushResult(entry: {
  userId: string
  productName: string
  sellPrice: number
  status: 'success' | 'failed'
  shopifyProductId?: string
  errorMessage?: string
}) {
  await ensureSchema()
  await sql`
    insert into push_history (user_id, product_name, sell_price, status, shopify_product_id, error_message)
    values (${entry.userId}, ${entry.productName}, ${entry.sellPrice}, ${entry.status},
            ${entry.shopifyProductId || null}, ${entry.errorMessage || null})
  `
}

export async function getPushHistory(userId: string, limit: number) {
  await ensureSchema()
  return sql`
    select * from push_history where user_id = ${userId} order by pushed_at desc limit ${limit}
  `
}

// ─── Search sessions ─────────────────────────────────────────────────────────

export async function upsertSearchSession(userId: string, session: {
  platforms: string[]
  category: string
  sortBy: string
  customNiche: string
  results: unknown
}) {
  await ensureSchema()
  await sql`
    insert into search_sessions (user_id, platforms, category, sort_by, custom_niche, results, searched_at)
    values (${userId}, ${session.platforms}, ${session.category}, ${session.sortBy},
            ${session.customNiche}, ${sql.json(session.results as never)}, now())
    on conflict (user_id) do update set
      platforms = excluded.platforms,
      category = excluded.category,
      sort_by = excluded.sort_by,
      custom_niche = excluded.custom_niche,
      results = excluded.results,
      searched_at = excluded.searched_at
  `
}

export async function getSearchSession(userId: string) {
  await ensureSchema()
  const rows = await sql`select * from search_sessions where user_id = ${userId}`
  return rows[0] ?? null
}

// ─── Catalog items ───────────────────────────────────────────────────────────

export async function getCatalogItems(userId: string) {
  await ensureSchema()
  return sql`select * from catalog_items where user_id = ${userId} order by added_at desc`
}

export async function addCatalogItems(userId: string, productIds: string[], source: string) {
  await ensureSchema()
  await sql`
    insert into catalog_items (user_id, product_id, source)
    select ${userId}, unnest(${productIds}::text[]), ${source}
    on conflict (user_id, product_id) do nothing
  `
}

export async function removeCatalogItem(userId: string, productId: string) {
  await ensureSchema()
  await sql`delete from catalog_items where user_id = ${userId} and product_id = ${productId}`
}

export async function markCatalogItemPushed(userId: string, productId: string, shopifyProductId?: string) {
  await ensureSchema()
  await sql`
    update catalog_items
    set pushed_at = now(), shopify_product_id = ${shopifyProductId || null}
    where user_id = ${userId} and product_id = ${productId}
  `
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getAnalyticsData(userId: string) {
  await ensureSchema()
  const [saved, history, session] = await Promise.all([
    sql`select id, score, trend, sell_price, source_price, saved_at from saved_products where user_id = ${userId}`,
    sql`select id, status, sell_price, pushed_at from push_history where user_id = ${userId}`,
    sql`select searched_at, platforms, category from search_sessions where user_id = ${userId}`,
  ])
  return { saved, history, session: session[0] ?? null }
}
