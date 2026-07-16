// Pricing Engine & Margin Calculator
import type { PricingRule } from '@/lib/types'

export class PricingEngine {
  static calculatePrice(
    costPrice: number,
    rules: PricingRule[]
  ): number {
    let finalPrice = costPrice

    // Apply active rules in order
    const activeRules = rules.filter(r => r.isActive).sort((a, b) => a.id - b.id)

    for (const rule of activeRules) {
      if (rule.markupType === 'percentage') {
        finalPrice = costPrice * (1 + rule.markupValue / 100)
      } else if (rule.markupType === 'fixed') {
        finalPrice = costPrice + rule.markupValue
      }

      // Apply min/max price constraints
      if (rule.minPrice && finalPrice < rule.minPrice) {
        finalPrice = rule.minPrice
      }
      if (rule.maxPrice && finalPrice > rule.maxPrice) {
        finalPrice = rule.maxPrice
      }
    }

    return Math.round(finalPrice * 100) / 100
  }

  static calculateMargin(costPrice: number, sellingPrice: number): number {
    if (costPrice === 0) return 0
    return Math.round(((sellingPrice - costPrice) / costPrice) * 100 * 100) / 100
  }

  static calculateProfit(costPrice: number, sellingPrice: number, quantity: number = 1): number {
    return Math.round((sellingPrice - costPrice) * quantity * 100) / 100
  }

  static getRecommendedPrice(
    costPrice: number,
    targetMargin: number = 50 // 50% default margin
  ): number {
    return Math.round(costPrice * (1 + targetMargin / 100) * 100) / 100
  }

  static formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
  }
}

export function calculateOrderProfitability(
  items: Array<{
    quantity: number
    unitCost: number
    unitPrice: number
  }>
): {
  totalCost: number
  totalPrice: number
  totalProfit: number
  marginPercentage: number
} {
  let totalCost = 0
  let totalPrice = 0

  for (const item of items) {
    totalCost += item.unitCost * item.quantity
    totalPrice += item.unitPrice * item.quantity
  }

  const totalProfit = totalPrice - totalCost
  const marginPercentage = totalCost > 0 
    ? Math.round(((totalProfit / totalCost) * 100) * 100) / 100
    : 0

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    marginPercentage,
  }
}
