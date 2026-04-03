// app/api/products/search/route.ts
// Handles AI product search. Keeps Anthropic API key server-side.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from 'anthropic'
import { supabaseAdmin } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { platforms, category, sortBy, customNiche, userId } = await req.json()

    if (!platforms?.length) {
      return NextResponse.json({ error: 'Select at least one platform' }, { status: 400 })
    }

    const prompt = buildPrompt(platforms, category, sortBy, customNiche)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.map((b: any) => b.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const products = JSON.parse(clean)

    // If user is logged in, save the search session to DB
    if (userId) {
      await supabaseAdmin
        .from('search_sessions')
        .upsert({
          user_id: userId,
          platforms,
          category,
          sort_by: sortBy,
          custom_niche: customNiche,
          results: products,
          searched_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ products })
  } catch (err: any) {
    console.error('Search error:', err)
    return NextResponse.json({ error: err.message || 'Search failed' }, { status: 500 })
  }
}

function buildPrompt(platforms: string[], category: string, sortBy: string, customNiche: string) {
  return `You are a dropshipping product research expert. Generate 8 best-selling products for: ${platforms.join(', ')}.
${category && category !== 'All Categories' ? 'Category: ' + category : 'Mix of popular categories.'}
${customNiche ? 'Niche: ' + customNiche : ''}
Sort by: ${sortBy || 'Best Selling'}

Return ONLY a valid JSON array with 8 objects. No markdown, no backticks, no explanation.
[{"name":"Specific product name","category":"Category","trend":"🔥 Hot","margin":38,"sellPrice":"29.99","sourcePrice":"9.50","monthlySales":"3.2k","rating":4.6,"competition":"Low","score":8.4,"platforms":["aliexpress"],"tags":["trending","gift"],"aiInsight":"2-3 sentence expert insight.","imageUrl":""}]
trend: "🔥 Hot"|"📈 Rising"|"✅ Stable"|"⚡ Viral"
competition: "Low"|"Medium"|"High"
Only use platform IDs from: ${platforms.join(', ')}`
}
