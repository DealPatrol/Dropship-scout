// lib/db.ts
// All database queries in one place — plain SQL against Postgres.

import { ensureSchema, sql } from './database'
import { decryptSecret, encryptSecret } from './secrets'
import { PlanLimitError, planLimitMessage, type Plan } from './billing'
import type { Product } from './types'

// ─── Users / Shopify credentials ─────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  await ensureSchema()
  const rows = await sql`
    select id, email, shopify_domain, plan, stripe_subscription_status, created_at
    from users where id = ${userId}
  `
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
    const encryptedToken = encryptSecret(token)
    await sql`
      update users set shopify_domain = ${domain}, shopify_token_enc = ${encryptedToken}
      where id = ${userId}
    `
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
  return { domain: row.shopify_domain, token: decryptSecret(row.shopify_token_enc) }
}

// ─── Billing ────────────────────────────────────────────────────────────────

export async function getUserPlan(userId: string): Promise<Plan> {
  await ensureSchema()
  const rows = await sql`select plan from users where id = ${userId}`
  return rows[0]?.plan === 'pro' ? 'pro' : 'free'
}

export async function getBillingProfile(userId: string) {
  await ensureSchema()
  const rows = await sql`
    select plan, stripe_customer_id, stripe_subscription_id, stripe_subscription_status
    from users where id = ${userId}
  `
  return rows[0] ?? null
}

export async function setStripeCustomer(userId: string, customerId: string) {
  await ensureSchema()
  await sql`update users set stripe_customer_id = ${customerId} where id = ${userId}`
}

interface StripeSubscriptionState {
  userId?: string
  customerId: string
  subscriptionId: string
  status: string
  plan: Plan
}

export async function reconcileStripeSubscription(input: {
  userId?: string
  subscriptionId: string
  lockKey: string
  eventCreated: number
  loadCurrent: () => Promise<StripeSubscriptionState>
}) {
  await ensureSchema()
  await sql.begin(async transaction => {
    await transaction`
      select pg_advisory_xact_lock(hashtext(${`stripe:${input.lockKey}`}))
    `
    const current = await input.loadCurrent()
    const userId = input.userId || current.userId

    if (userId) {
      await transaction`
        update users
        set stripe_customer_id = ${current.customerId},
            stripe_subscription_id = ${current.subscriptionId},
            stripe_subscription_status = ${current.status},
            stripe_event_created = ${input.eventCreated},
            plan = ${current.plan}
        where id = ${userId}
          and stripe_event_created <= ${input.eventCreated}
      `
      return
    }

    await transaction`
      update users
      set stripe_subscription_id = ${current.subscriptionId},
          stripe_subscription_status = ${current.status},
          stripe_event_created = ${input.eventCreated},
          plan = ${current.plan}
      where stripe_customer_id = ${current.customerId}
        and stripe_event_created <= ${input.eventCreated}
    `
  })
}

export async function recordStripeEvent(eventId: string, eventType: string): Promise<boolean> {
  await ensureSchema()
  const rows = await sql`
    insert into stripe_events (event_id, event_type)
    values (${eventId}, ${eventType})
    on conflict (event_id) do nothing
    returning event_id
  `
  return rows.length > 0
}

export async function hasStripeEvent(eventId: string): Promise<boolean> {
  await ensureSchema()
  const rows = await sql`select 1 from stripe_events where event_id = ${eventId}`
  return rows.length > 0
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

export async function countSavedProducts(userId: string): Promise<number> {
  await ensureSchema()
  const rows = await sql`select count(*)::int as count from saved_products where user_id = ${userId}`
  return Number(rows[0]?.count ?? 0)
}

export async function getSavedProductRows(userId: string) {
  await ensureSchema()
  return sql`select * from saved_products where user_id = ${userId} order by score desc`
}

export async function insertSavedProduct(
  userId: string,
  product: Product,
  limit: number | null = null
): Promise<string> {
  await ensureSchema()
  return sql.begin(async transaction => {
    await transaction`select pg_advisory_xact_lock(hashtext(${userId}))`
    if (limit !== null) {
      const countRows = await transaction`
        select count(*)::int as count from saved_products where user_id = ${userId}
      `
      if (Number(countRows[0]?.count ?? 0) >= limit) {
        throw new PlanLimitError(planLimitMessage('saved products', limit))
      }
    }

    const rows = await transaction`
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
    return String(rows[0].id)
  })
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

export type ShopifyPushClaim =
  | { state: 'claimed' }
  | { state: 'existing'; shopifyProductId: string }
  | { state: 'in_progress' }
  | { state: 'limit' }

export async function claimShopifyPush(
  userId: string,
  operationKey: string,
  limit: number | null
): Promise<ShopifyPushClaim> {
  await ensureSchema()
  return sql.begin(async transaction => {
    await transaction`
      select pg_advisory_xact_lock(hashtext(${`${userId}:${operationKey}`}))
    `
    const rows = await transaction`
      select status, shopify_product_id, reserved, updated_at
      from shopify_push_operations
      where user_id = ${userId} and operation_key = ${operationKey}
      for update
    `
    const existing = rows[0]
    if (existing?.status === 'success' && existing.shopify_product_id) {
      return { state: 'existing', shopifyProductId: String(existing.shopify_product_id) } as const
    }
    if (
      existing?.status === 'pending' &&
      new Date(existing.updated_at).getTime() > Date.now() - 2 * 60 * 1000
    ) {
      return { state: 'in_progress' } as const
    }

    const alreadyReserved = Boolean(existing?.reserved)
    if (!alreadyReserved && limit !== null) {
      const usageRows = await transaction`
        insert into usage_counters (user_id, usage_key, period_start, count)
        values (${userId}, 'shopify_push', date_trunc('month', now())::date, 1)
        on conflict (user_id, usage_key, period_start) do update
          set count = usage_counters.count + 1
          where usage_counters.count < ${limit}
        returning count
      `
      if (usageRows.length === 0) return { state: 'limit' } as const
    }

    await transaction`
      insert into shopify_push_operations (
        user_id, operation_key, status, reserved, updated_at
      ) values (${userId}, ${operationKey}, 'pending', true, now())
      on conflict (user_id, operation_key) do update set
        status = 'pending',
        error_message = null,
        reserved = true,
        updated_at = now()
    `
    return { state: 'claimed' } as const
  })
}

export async function completeShopifyPush(input: {
  userId: string
  operationKey: string
  success: boolean
  shopifyProductId?: string
  errorMessage?: string
}) {
  await ensureSchema()
  await sql.begin(async transaction => {
    await transaction`
      select pg_advisory_xact_lock(hashtext(${`${input.userId}:${input.operationKey}`}))
    `
    const rows = await transaction`
      select reserved from shopify_push_operations
      where user_id = ${input.userId} and operation_key = ${input.operationKey}
      for update
    `
    const reserved = Boolean(rows[0]?.reserved)

    if (!input.success && reserved) {
      await transaction`
        update usage_counters
        set count = greatest(count - 1, 0)
        where user_id = ${input.userId}
          and usage_key = 'shopify_push'
          and period_start = date_trunc('month', now())::date
      `
    }

    await transaction`
      update shopify_push_operations
      set status = ${input.success ? 'success' : 'failed'},
          shopify_product_id = ${input.shopifyProductId || null},
          error_message = ${input.errorMessage || null},
          reserved = ${input.success},
          updated_at = now()
      where user_id = ${input.userId} and operation_key = ${input.operationKey}
    `
  })
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
  return sql`
    select
      catalog_items.id,
      catalog_items.user_id,
      catalog_items.product_id,
      catalog_items.source,
      catalog_items.added_at,
      case
        when catalog_items.shopify_domain = users.shopify_domain then catalog_items.pushed_at
        else null
      end as pushed_at,
      case
        when catalog_items.shopify_domain = users.shopify_domain then catalog_items.shopify_product_id
        else null
      end as shopify_product_id,
      catalog_items.shopify_domain
    from catalog_items
    join users on users.id = catalog_items.user_id
    where catalog_items.user_id = ${userId}
    order by catalog_items.added_at desc
  `
}

export async function countCatalogItems(userId: string): Promise<number> {
  await ensureSchema()
  const rows = await sql`select count(*)::int as count from catalog_items where user_id = ${userId}`
  return Number(rows[0]?.count ?? 0)
}

/** Adds products to the catalog; returns how many were newly inserted. */
export async function addCatalogItems(
  userId: string,
  productIds: string[],
  source: string,
  limit: number | null = null
): Promise<number> {
  await ensureSchema()
  return sql.begin(async transaction => {
    await transaction`select pg_advisory_xact_lock(hashtext(${userId}))`
    if (limit !== null) {
      const countRows = await transaction`
        select count(*)::int as count from catalog_items where user_id = ${userId}
      `
      const incomingRows = await transaction`
        select count(*)::int as count
        from unnest(${productIds}::text[]) as requested(product_id)
        where not exists (
          select 1 from catalog_items
          where user_id = ${userId} and product_id = requested.product_id
        )
      `
      const current = Number(countRows[0]?.count ?? 0)
      const incoming = Number(incomingRows[0]?.count ?? 0)
      if (current + incoming > limit) {
        throw new PlanLimitError(planLimitMessage('catalog products', limit))
      }
    }

    const inserted = await transaction`
      insert into catalog_items (user_id, product_id, source)
      select ${userId}, unnest(${productIds}::text[]), ${source}
      on conflict (user_id, product_id) do nothing
      returning id
    `
    return inserted.length
  })
}

export async function getCatalogItemsForProducts(userId: string, productIds: string[]) {
  await ensureSchema()
  return sql`
    select product_id, pushed_at, shopify_product_id, shopify_domain
    from catalog_items
    where user_id = ${userId} and product_id = any(${productIds})
  `
}

export async function removeCatalogItem(userId: string, productId: string) {
  await ensureSchema()
  await sql`delete from catalog_items where user_id = ${userId} and product_id = ${productId}`
}

export async function markCatalogItemPushed(
  userId: string,
  productId: string,
  shopifyDomain: string,
  shopifyProductId?: string
) {
  await ensureSchema()
  await sql`
    update catalog_items
    set pushed_at = now(),
        shopify_product_id = ${shopifyProductId || null},
        shopify_domain = ${shopifyDomain}
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
