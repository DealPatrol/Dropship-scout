// lib/pricing-calculator.ts
// Profit margin and pricing utilities for dropshipping products

export interface PricingBreakdown {
  sourcePrice: number
  sellPrice: number
  grossProfit: number
  marginPercent: number
  roi: number
}

export interface PricingSuggestion {
  conservative: number  // lower margin, more competitive
  balanced: number      // target ~50% margin
  aggressive: number    // higher margin, premium positioning
}

export interface FeeStructure {
  platformFeePercent: number  // e.g. Shopify transaction fee
  paymentFeePercent: number   // e.g. Stripe 2.9% + $0.30
  paymentFeeFlat: number
  shippingCost: number
}

const DEFAULT_FEES: FeeStructure = {
  platformFeePercent: 2,
  paymentFeePercent: 2.9,
  paymentFeeFlat: 0.30,
  shippingCost: 0,
}

export function calcMarginPercent(sourcePrice: number, sellPrice: number): number {
  if (sellPrice <= 0) return 0
  return parseFloat((((sellPrice - sourcePrice) / sellPrice) * 100).toFixed(1))
}

export function calcROI(sourcePrice: number, sellPrice: number): number {
  if (sourcePrice <= 0) return 0
  return parseFloat((((sellPrice - sourcePrice) / sourcePrice) * 100).toFixed(1))
}

export function calcGrossProfit(sourcePrice: number, sellPrice: number): number {
  return parseFloat((sellPrice - sourcePrice).toFixed(2))
}

export function calcNetProfit(
  sourcePrice: number,
  sellPrice: number,
  fees: Partial<FeeStructure> = {}
): number {
  const f = { ...DEFAULT_FEES, ...fees }
  const platformFee = (sellPrice * f.platformFeePercent) / 100
  const paymentFee = (sellPrice * f.paymentFeePercent) / 100 + f.paymentFeeFlat
  const net = sellPrice - sourcePrice - platformFee - paymentFee - f.shippingCost
  return parseFloat(net.toFixed(2))
}

export function calcNetMarginPercent(
  sourcePrice: number,
  sellPrice: number,
  fees: Partial<FeeStructure> = {}
): number {
  if (sellPrice <= 0) return 0
  return parseFloat(((calcNetProfit(sourcePrice, sellPrice, fees) / sellPrice) * 100).toFixed(1))
}

export function getPricingBreakdown(
  sourcePrice: number,
  sellPrice: number
): PricingBreakdown {
  return {
    sourcePrice,
    sellPrice,
    grossProfit: calcGrossProfit(sourcePrice, sellPrice),
    marginPercent: calcMarginPercent(sourcePrice, sellPrice),
    roi: calcROI(sourcePrice, sellPrice),
  }
}

export function suggestPricing(
  sourcePrice: number,
  targetMargins = { conservative: 0.35, balanced: 0.50, aggressive: 0.65 }
): PricingSuggestion {
  const toSellPrice = (margin: number) =>
    parseFloat((sourcePrice / (1 - margin)).toFixed(2))

  return {
    conservative: toSellPrice(targetMargins.conservative),
    balanced: toSellPrice(targetMargins.balanced),
    aggressive: toSellPrice(targetMargins.aggressive),
  }
}

export function isMarginsViable(sourcePrice: number, sellPrice: number): boolean {
  return calcMarginPercent(sourcePrice, sellPrice) >= 20
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
