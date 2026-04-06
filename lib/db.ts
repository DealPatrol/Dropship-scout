// lib/db.ts
// Database query helpers — thin wrappers around supabaseAdmin for common patterns

import { supabaseAdmin } from './supabase'

export async function getUserProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function upsertProfile(userId: string, updates: Record<string, unknown>) {
  return supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, ...updates })
}

export async function getTrackedProducts(userId: string) {
  const { data } = await supabaseAdmin
    .from('saved_products')
    .select('id, name, category, score, trend, updated_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
  return data || []
}

export async function updateProductTracking(
  id: string,
  updates: { score?: number; trend?: string; ai_insight?: string }
) {
  return supabaseAdmin
    .from('saved_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function logPushResult(entry: {
  userId: string
  productName: string
  sellPrice: number
  status: 'success' | 'failed'
  shopifyProductId?: string
  errorMessage?: string
}) {
  return supabaseAdmin.from('push_history').insert({
    user_id: entry.userId,
    product_name: entry.productName,
    sell_price: entry.sellPrice,
    status: entry.status,
    shopify_product_id: entry.shopifyProductId || null,
    error_message: entry.errorMessage || null,
  })
}
