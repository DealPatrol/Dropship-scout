// app/api/catalog/build/route.ts
// POST: AI Catalog Builder — parse a natural-language goal into criteria
// (Claude when available, heuristic parser otherwise), assemble a balanced
// catalog, and persist it to the user's catalog.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSession } from '@/lib/auth'
import { addCatalogItems } from '@/lib/db'
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
// Body: { prompt }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt) {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 })
  }

  const criteria = (await parseWithClaude(prompt)) ?? parseBuilderPrompt(prompt)
  const result = buildCatalog(criteria)
  const productIds = result.products.map(product => product.id)
  let added = 0

  if (productIds.length > 0) {
    try {
      added = await addCatalogItems(user.id, productIds, 'ai_builder')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save catalog'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  return NextResponse.json({
    summary: result.summary,
    criteria: result.criteria,
    productIds,
    added,
  })
}
