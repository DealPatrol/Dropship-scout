// app/api/products/recommendations/route.ts
// AI-powered product recommendations derived from the user's search and save history

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { Product } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// GET /api/products/recommendations?userId=xxx&limit=6
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '6', 10), 12)

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    // Fetch saved products and most recent search session in parallel
    const [savedRes, sessionRes] = await Promise.all([
      supabaseAdmin
        .from('saved_products')
        .select('name, category, trend, margin, score, tags, platforms')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })
        .limit(20),

      supabaseAdmin
        .from('search_sessions')
        .select('platforms, category, custom_niche, sort_by')
        .eq('user_id', userId)
        .order('searched_at', { ascending: false })
        .limit(1)
        .single(),
    ])

    const saved = savedRes.data || []
    const lastSession = sessionRes.data

    if (saved.length === 0 && !lastSession) {
      return NextResponse.json(
        { error: 'No history found. Search for products first to get recommendations.' },
        { status: 404 }
      )
    }

    const prompt = buildRecommendationPrompt(saved, lastSession, limit)

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .map((b: { type: string; text?: string }) => ('text' in b ? b.text : '') || '')
      .join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const recommendations: Product[] = JSON.parse(clean)

    return NextResponse.json({ recommendations })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Recommendations failed'
    console.error('Recommendations error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function buildRecommendationPrompt(
  savedProducts: Record<string, unknown>[],
  lastSession: Record<string, unknown> | null,
  limit: number
): string {
  const savedSummary =
    savedProducts.length > 0
      ? savedProducts
          .map(p => `"${p.name}" (${p.category}, score ${p.score}, margin ${p.margin}%)`)
          .join(', ')
      : 'none yet'

  const platformList = lastSession?.platforms
    ? (lastSession.platforms as string[]).join(', ')
    : 'aliexpress'

  const categoryHint =
    lastSession?.category && lastSession.category !== 'All Categories'
      ? String(lastSession.category)
      : 'mixed'

  const nicheHint = lastSession?.custom_niche ? `Niche preference: ${lastSession.custom_niche}.` : ''

  return `You are a dropshipping product research expert. Based on this user's history, recommend ${limit} new products they haven't saved yet.

Saved products: ${savedSummary}
Preferred platforms: ${platformList}
Category focus: ${categoryHint}
${nicheHint}

Rules:
- Recommend products similar in style/niche to what they saved, but distinct items they likely haven't tried
- Prioritise products with margin ≥ 35% and score ≥ 7.0
- Use only platform IDs from: aliexpress, amazon, temu, walmart, ebay, cjdropship, spocket, zendrop

Return ONLY a valid JSON array with ${limit} objects. No markdown, no backticks, no explanation.
[{"name":"Specific product name","category":"Category","trend":"🔥 Hot","margin":42,"sellPrice":"34.99","sourcePrice":"12.00","monthlySales":"2.8k","rating":4.5,"competition":"Low","score":8.1,"platforms":["aliexpress"],"tags":["trending"],"aiInsight":"2-3 sentence expert insight.","imageUrl":""}]
trend: "🔥 Hot"|"📈 Rising"|"✅ Stable"|"⚡ Viral"
competition: "Low"|"Medium"|"High"`
}
