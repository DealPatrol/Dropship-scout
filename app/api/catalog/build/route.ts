// app/api/catalog/build/route.ts
// POST: AI Catalog Builder — parse a natural-language goal into criteria
// (Claude when available, heuristic parser otherwise), assemble a balanced
// catalog, and persist it to the user's catalog.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { buildCatalog, parseBuilderPrompt } from '@/lib/merchandising/builder'
import { NICHES } from '@/lib/merchandising/data'
import type { BuilderCriteria } from '@/lib/merchandising/types'

async function parseWithClaude(prompt: string): Promise<BuilderCriteria | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Parse this store-building request into JSON criteria.
Request: "${prompt}"

Valid niche ids: ${NICHES.map(n => n.id).join(', ')}

Return ONLY valid JSON (no markdown):
{"niches":["pets"],"count":25,"maxPrice":30,"minMargin":40,"multiNicheOnly":false,"impulseOnly":false}
Rules: niches = matching niche ids or [] for all. count = requested product count or 25.
maxPrice/minMargin = numbers only if explicitly mentioned, else null.
multiNicheOnly = true if they want general-store / multi-niche products.
impulseOnly = true if they want viral/TikTok/impulse products.`,
      }],
    })

    const text = message.content.map(b => ('text' in b ? b.text : '')).join('')
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    const validNiches = new Set(NICHES.map(n => n.id))

    return {
      niches: Array.isArray(parsed.niches) ? parsed.niches.filter((n: string) => validNiches.has(n as (typeof NICHES)[number]['id'])) : [],
      count: Math.min(Math.max(Number(parsed.count) || 25, 3), 100),
      maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : undefined,
      minMargin: typeof parsed.minMargin === 'number' ? parsed.minMargin : undefined,
      multiNicheOnly: Boolean(parsed.multiNicheOnly),
      impulseOnly: Boolean(parsed.impulseOnly),
      prompt,
    }
  } catch {
    return null
  }
}

// POST /api/catalog/build
// Body: { userId, prompt }
export async function POST(req: NextRequest) {
  const { userId, prompt } = await req.json()
  if (!userId || !prompt) {
    return NextResponse.json({ error: 'userId and prompt required' }, { status: 400 })
  }

  const criteria = (await parseWithClaude(prompt)) ?? parseBuilderPrompt(prompt)
  const result = buildCatalog(criteria)

  if (result.products.length > 0) {
    const { error } = await supabaseAdmin.from('catalog_items').upsert(
      result.products.map(product => ({
        user_id: userId,
        product_id: product.id,
        source: 'ai_builder',
      })),
      { onConflict: 'user_id,product_id', ignoreDuplicates: true }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    summary: result.summary,
    criteria: result.criteria,
    productIds: result.products.map(product => product.id),
  })
}
