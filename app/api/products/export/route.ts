// app/api/products/export/route.ts
// Exports saved products as a Shopify-compatible CSV file

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/products/export?userId=xxx&format=shopify
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const format = req.nextUrl.searchParams.get('format') || 'shopify'

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('saved_products')
    .select('*')
    .eq('user_id', userId)
    .order('score', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'No saved products to export' }, { status: 404 })

  const csv = format === 'shopify' ? buildShopifyCSV(data) : buildSimpleCSV(data)
  const filename = `dropship-scout-export-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function buildShopifyCSV(products: Record<string, unknown>[]): string {
  const headers = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type',
    'Tags', 'Published', 'Variant Price', 'Variant Compare At Price',
    'Variant Inventory Qty', 'Variant Requires Shipping', 'Variant Taxable',
    'Image Src', 'SEO Title', 'SEO Description',
  ]

  const rows = products.map(p => {
    const name = String(p.name || '')
    const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const sellPrice = String(p.sell_price || '0')
    const comparePrice = (parseFloat(sellPrice) * 1.3).toFixed(2)
    const tags = Array.isArray(p.tags) ? [...p.tags, p.category, 'dropship'].join(', ') : String(p.category || '')

    return [
      handle,
      name,
      `<p>${p.ai_insight || ''}</p>`,
      'DropShip Scout',
      String(p.category || ''),
      tags,
      'true',
      sellPrice,
      comparePrice,
      '99',
      'true',
      'true',
      String(p.image_url || ''),
      name,
      String(p.ai_insight || '').slice(0, 160),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

function buildSimpleCSV(products: Record<string, unknown>[]): string {
  const headers = ['Name', 'Category', 'Trend', 'Score', 'Sell Price', 'Source Price', 'Margin %', 'Monthly Sales', 'Rating', 'Competition', 'Tags']

  const rows = products.map(p => [
    p.name,
    p.category,
    p.trend,
    p.score,
    p.sell_price,
    p.source_price,
    p.margin,
    p.monthly_sales,
    p.rating,
    p.competition,
    Array.isArray(p.tags) ? (p.tags as string[]).join('; ') : '',
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))

  return [headers.join(','), ...rows].join('\n')
}
