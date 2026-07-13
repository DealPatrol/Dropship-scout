// app/api/products/saved/route.ts
// GET: fetch user's saved products
// POST: save a product
// DELETE: remove a saved product

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/products/saved?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('saved_products')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map snake_case DB columns back to camelCase for the frontend
  const products = (data || []).map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    trend: row.trend,
    margin: row.margin,
    sellPrice: String(row.sell_price),
    sourcePrice: String(row.source_price),
    monthlySales: row.monthly_sales,
    rating: row.rating,
    competition: row.competition,
    score: row.score,
    platforms: row.platforms,
    tags: row.tags,
    aiInsight: row.ai_insight,
    imageUrl: row.image_url,
    savedAt: row.saved_at,
  }))

  return NextResponse.json({ products })
}

// POST /api/products/saved
// Body: { userId, product }
export async function POST(req: NextRequest) {
  const { userId, product } = await req.json()
  if (!userId || !product) return NextResponse.json({ error: 'userId and product required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('saved_products')
    .insert({
      user_id: userId,
      name: product.name,
      category: product.category,
      trend: product.trend,
      margin: product.margin,
      sell_price: parseFloat(product.sellPrice),
      source_price: parseFloat(product.sourcePrice),
      monthly_sales: product.monthlySales,
      rating: product.rating,
      competition: product.competition,
      score: product.score,
      platforms: product.platforms,
      tags: product.tags,
      ai_insight: product.aiInsight,
      image_url: product.imageUrl || '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

// DELETE /api/products/saved?id=xxx&userId=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const userId = req.nextUrl.searchParams.get('userId')
  if (!id || !userId) return NextResponse.json({ error: 'id and userId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('saved_products')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
