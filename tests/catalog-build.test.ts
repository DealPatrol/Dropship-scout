import { describe, expect, it } from 'vitest'
import { buildCatalog, parseBuilderPrompt } from '@/lib/merchandising/builder'

describe('catalog builder', () => {
  it('parses niche, count, price, and margin constraints', () => {
    expect(
      parseBuilderPrompt('Build 8 pet products under $30 with 50% margin')
    ).toMatchObject({
      niches: ['pets'],
      count: 8,
      maxPrice: 30,
      minMargin: 50,
    })
  })

  it('builds a constrained deterministic catalog', () => {
    const criteria = parseBuilderPrompt('Build 6 pet products under $35')
    const result = buildCatalog(criteria)

    expect(result.products).toHaveLength(6)
    expect(result.products.every(product => product.niches.includes('pets'))).toBe(true)
    expect(result.products.every(product => product.price <= 35)).toBe(true)
    expect(new Set(result.products.map(product => product.id)).size).toBe(6)
  })

  it('caps untrusted requested counts at 100', () => {
    expect(parseBuilderPrompt('Build 9999 products').count).toBe(100)
  })
})
