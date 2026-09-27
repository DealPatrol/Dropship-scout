import { describe, expect, it } from 'vitest'
import { limitExceeded, PLAN_LIMITS, planForSubscriptionStatus } from '@/lib/billing'
import { validateSavedProduct } from '@/lib/saved-products'

const product = {
  name: 'Portable Fan',
  category: 'Outdoor',
  trend: '📈 Rising' as const,
  margin: 50,
  sellPrice: '24.99',
  sourcePrice: '8.50',
  monthlySales: '2.1k',
  rating: 4.5,
  competition: 'Medium' as const,
  score: 8,
  platforms: ['cjdropship' as const],
  tags: ['summer'],
  aiInsight: 'Demo insight',
}

describe('saved products', () => {
  it('accepts a valid product payload', () => {
    expect(validateSavedProduct(product)).toEqual(product)
  })

  it('rejects negative or missing prices', () => {
    expect(() => validateSavedProduct({ ...product, sourcePrice: '-1' })).toThrow(
      'product.sourcePrice'
    )
    expect(() => validateSavedProduct({ ...product, name: '' })).toThrow('product.name')
  })

  it('enforces the free saved-product limit while Pro stays unlimited', () => {
    expect(limitExceeded(10, 1, PLAN_LIMITS.free.savedProducts)).toBe(true)
    expect(limitExceeded(10_000, 1, PLAN_LIMITS.pro.savedProducts)).toBe(false)
  })

  it('grants Pro only for active or trialing subscriptions', () => {
    expect(planForSubscriptionStatus('active')).toBe('pro')
    expect(planForSubscriptionStatus('trialing')).toBe('pro')
    expect(planForSubscriptionStatus('past_due')).toBe('free')
    expect(planForSubscriptionStatus('canceled')).toBe('free')
  })
})
