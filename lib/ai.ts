// lib/ai.ts
// Anthropic AI integration — product search, trend analysis, insight generation

import Anthropic from '@anthropic-ai/sdk'
import { Product, SearchParams } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateProducts(params: SearchParams): Promise<Product[]> {
  const { platforms, category, sortBy, customNiche } = params

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildSearchPrompt(platforms, category, sortBy, customNiche) }],
  })

  const text = message.content.map((b: { type: string; text?: string }) => ('text' in b ? b.text : '') || '').join('')
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as Product[]
}

export async function refreshProductInsight(product: {
  name: string
  category: string
  currentScore: number
}): Promise<{ trend: string; score: number; aiInsight: string }> {
  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are a dropshipping market analyst. Re-evaluate this product's current market status.
Product: "${product.name}" in category "${product.category}"
Current score: ${product.currentScore}/10

Return ONLY valid JSON (no markdown):
{"trend":"🔥 Hot","score":8.2,"aiInsight":"1-2 sentence updated market insight."}
trend options: "🔥 Hot"|"📈 Rising"|"✅ Stable"|"⚡ Viral"
score: 0–10 float`,
    }],
  })

  const text = message.content.map((b: { type: string; text?: string }) => ('text' in b ? b.text : '') || '').join('')
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

function buildSearchPrompt(
  platforms: string[],
  category: string,
  sortBy: string,
  customNiche: string
): string {
  return `You are a dropshipping product research assistant. Suggest 8 product ideas for: ${platforms.join(', ')}.
${category && category !== 'All Categories' ? 'Category: ' + category : 'Mix of practical categories.'}
${customNiche ? 'Niche: ' + customNiche : ''}
Sort preference: ${sortBy || 'Best Selling'}

Rules:
- These are ideas, not live market data.
- Set monthlySales to the exact string "Not verified" on every object.
- Do not invent unit sales, order counts, revenue, or "k" volume figures in any field, including aiInsight.
- sellPrice and sourcePrice are rough planning numbers, not live supplier quotes. Say that in aiInsight.
- Do not claim a product is trending, viral, or a best seller as a measured fact.

Return ONLY a valid JSON array with 8 objects. No markdown, no backticks, no explanation.
[{"name":"Specific product name","category":"Category","trend":"🔥 Hot","margin":38,"sellPrice":"29.99","sourcePrice":"9.50","monthlySales":"Not verified","rating":4.6,"competition":"Low","score":8.4,"platforms":["aliexpress"],"tags":["gift"],"aiInsight":"Who it is for, what to check with a supplier, and that prices are estimates.","imageUrl":""}]
trend: "🔥 Hot"|"📈 Rising"|"✅ Stable"|"⚡ Viral"
competition: "Low"|"Medium"|"High"
Only use platform IDs from: ${platforms.join(', ')}`
}
