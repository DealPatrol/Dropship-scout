import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'

/**
 * Sale discount math for one dropshipped product. Scenario math only: it uses
 * the amounts the visitor types and does not forecast demand. Percentage fees
 * and the refund reserve apply to the discounted price the customer pays.
 * Supplier cost, the shipping the seller pays, the flat card fee, and ad cost
 * per sale do not fall when the price falls.
 */

export const SALE_DISCOUNT_PATH = '/tools/black-friday-discount-calculator'
export const SALE_DISCOUNT_TITLE = 'Black Friday discount calculator'
export const SALE_DISCOUNT_H1 = 'Black Friday discount calculator for dropshipping'
export const SALE_DISCOUNT_DESCRIPTION =
  'Free BFCM discount calculator for dropshippers. See the deepest discount a product can take, profit at 10-50% off, and break-even ROAS. No signup.'
export const SALE_DISCOUNT_UPDATED = '2026-11-26'

export const SALE_DISCOUNT_TIERS = [0, 10, 15, 20, 25, 30, 40, 50] as const

export interface SaleDiscountInput {
  /** Regular price the customer pays for the product, including any shipping charged. */
  regularPrice: number
  unitCost: number
  shippingCost: number
  paymentFeePercent: number
  paymentFeeFlat: number
  platformFeePercent: number
  returnsReservePercent: number
  /** Ad cost per sale outside the sale period. */
  adCostPerOrder: number
  /** Ad cost per sale during the sale. Null means the same as normal. */
  saleAdCostPerOrder: number | null
  /** Planned discount, 0-95. */
  discountPercent: number
}

export interface SaleTierRow {
  discountPercent: number
  salePrice: number
  beforeAds: number
  profitPerOrder: number
  marginPercent: number
  /** Orders needed at this discount to keep full-price profit. Null when it cannot. */
  ordersMultiple: number | null
}

export interface SaleDiscountResult {
  salePrice: number
  fullPriceProfit: number
  saleProfit: number
  saleBeforeAds: number
  /** Deepest discount (percent, rounded down to 0.1) that still leaves zero or more. Null if even full price loses. */
  maxDiscountPercent: number | null
  /** Break-even ROAS at the sale price, rounded up to 0.01. Null when nothing is left before ads. */
  breakEvenRoas: number | null
  ordersMultiple: number | null
  verdict: 'loses-at-full-price' | 'loses-at-sale' | 'thin' | 'ok'
  tiers: SaleTierRow[]
}

const MAX_MONEY = 1_000_000

function percentShare(input: SaleDiscountInput): number {
  return (input.paymentFeePercent + input.platformFeePercent + input.returnsReservePercent) / 100
}

function fixedCosts(input: SaleDiscountInput): number {
  return input.unitCost + input.shippingCost + input.paymentFeeFlat
}

function saleAd(input: SaleDiscountInput): number {
  return input.saleAdCostPerOrder ?? input.adCostPerOrder
}

export function validateSaleInput(input: SaleDiscountInput): string | null {
  const money: [number, string][] = [
    [input.regularPrice, 'Regular price'],
    [input.unitCost, 'Supplier cost'],
    [input.shippingCost, 'Shipping you pay'],
    [input.paymentFeeFlat, 'Card fee flat amount'],
    [input.adCostPerOrder, 'Ad cost per sale'],
  ]
  if (input.saleAdCostPerOrder !== null) money.push([input.saleAdCostPerOrder, 'Sale ad cost per sale'])
  for (const [value, label] of money) {
    if (!Number.isFinite(value) || value < 0 || value > MAX_MONEY) return `${label} has to be a non-negative amount.`
  }
  if (input.regularPrice <= 0) return 'Enter a regular price greater than zero.'
  const percents: [number, string][] = [
    [input.paymentFeePercent, 'Card fee percent'],
    [input.platformFeePercent, 'Platform fee percent'],
    [input.returnsReservePercent, 'Refund reserve percent'],
  ]
  for (const [value, label] of percents) {
    if (!Number.isFinite(value) || value < 0 || value > 100) return `${label} has to be between 0 and 100.`
  }
  if (percentShare(input) >= 1) return 'Percentage fees and the refund reserve add up to 100% or more.'
  if (!Number.isFinite(input.discountPercent) || input.discountPercent < 0 || input.discountPercent > 95) {
    return 'The planned discount has to be between 0 and 95 percent.'
  }
  return null
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function tierRow(input: SaleDiscountInput, discountPercent: number, fullProfit: number): SaleTierRow {
  const salePrice = input.regularPrice * (1 - discountPercent / 100)
  const beforeAds = salePrice * (1 - percentShare(input)) - fixedCosts(input)
  const ad = discountPercent === 0 ? input.adCostPerOrder : saleAd(input)
  const profitPerOrder = beforeAds - ad
  return {
    discountPercent,
    salePrice,
    beforeAds,
    profitPerOrder,
    marginPercent: salePrice > 0 ? (profitPerOrder / salePrice) * 100 : 0,
    ordersMultiple: fullProfit > 0 && profitPerOrder > 0 ? fullProfit / profitPerOrder : null,
  }
}

export function calculateSaleDiscount(input: SaleDiscountInput): SaleDiscountResult {
  const problem = validateSaleInput(input)
  if (problem) throw new RangeError(problem)
  const share = percentShare(input)
  const fullBeforeAds = input.regularPrice * (1 - share) - fixedCosts(input)
  const fullPriceProfit = fullBeforeAds - input.adCostPerOrder
  const planned = tierRow(input, input.discountPercent, fullPriceProfit)

  const ceilingRaw = 1 - (fixedCosts(input) + saleAd(input)) / (input.regularPrice * (1 - share))
  const maxDiscountPercent = ceilingRaw < 0 ? null : Math.floor(Math.min(ceilingRaw, 1) * 1000) / 10

  const breakEvenRoas = planned.beforeAds > 0
    ? Math.ceil((planned.salePrice / planned.beforeAds) * 100) / 100
    : null

  let verdict: SaleDiscountResult['verdict']
  if (fullPriceProfit <= 0) verdict = 'loses-at-full-price'
  else if (planned.profitPerOrder <= 0) verdict = 'loses-at-sale'
  else if (planned.marginPercent < 15) verdict = 'thin'
  else verdict = 'ok'

  const tierSet = new Set<number>([...SALE_DISCOUNT_TIERS, input.discountPercent])
  const tiers = [...tierSet].sort((a, b) => a - b).map(d => tierRow(input, d, fullPriceProfit))

  return {
    salePrice: planned.salePrice,
    fullPriceProfit,
    saleProfit: planned.profitPerOrder,
    saleBeforeAds: planned.beforeAds,
    maxDiscountPercent,
    breakEvenRoas,
    ordersMultiple: planned.ordersMultiple,
    verdict,
    tiers,
  }
}

/** Plain-English summary of a result, written from the numbers only. */
export function saleVerdictText(input: SaleDiscountInput, result: SaleDiscountResult): string {
  const money = (n: number) => `$${round2(n).toFixed(2)}`
  const d = input.discountPercent
  switch (result.verdict) {
    case 'loses-at-full-price':
      return `At full price this product already leaves ${money(result.fullPriceProfit)} per order after the costs you entered, so no discount can fix it. Lower the supplier cost or the ad cost per sale first.`
    case 'loses-at-sale':
      return `At ${d}% off the customer pays ${money(result.salePrice)} and each order leaves ${money(result.saleProfit)}. ${result.maxDiscountPercent !== null ? `Keep the offer below ${result.maxDiscountPercent}% off, ideally well below it.` : ''}`.trim()
    case 'thin':
      return `At ${d}% off each order leaves ${money(result.saleProfit)} (${round2(result.tiers.find(t => t.discountPercent === d)?.marginPercent ?? 0)}% of the sale price). That is under the 15% review line the launch workspace uses.${result.ordersMultiple ? ` You need about ${round2(result.ordersMultiple)}x your normal orders to keep the same profit.` : ''}`
    case 'ok':
      return `At ${d}% off each order leaves ${money(result.saleProfit)}.${result.ordersMultiple ? ` You need about ${round2(result.ordersMultiple)}x your normal orders to keep the same total profit.` : ''}${result.breakEvenRoas ? ` Ads have to return at least ${result.breakEvenRoas}x at the sale price.` : ''}`
    default: {
      const never: never = result.verdict
      return never
    }
  }
}

export const SALE_DISCOUNT_STEPS = [
  { name: 'Enter the regular price and real costs', text: 'Type the price the customer pays today, the dated supplier quote for that variant, the shipping you pay, and your card fee.' },
  { name: 'Add the ad cost per sale', text: 'Use the cost per sale from your own ads. If you expect ads to cost more during Black Friday week, enter that as the sale ad cost.' },
  { name: 'Pick the planned discount', text: 'Choose the percent off you are thinking about. The table also shows 10% to 50% off so you can compare.' },
  { name: 'Read the maximum discount', text: 'The calculator shows the deepest discount that still leaves zero. Set the offer well below it so the order still pays for overhead.' },
  { name: 'Check the orders multiple', text: 'If the sale needs 2x or 3x your normal orders to keep the same profit, decide whether a smaller discount or a bundle is the better offer.' },
] as const

export const SALE_DISCOUNT_FAQS = [
  {
    question: 'What is the maximum Black Friday discount I can give?',
    answer: 'It is 1 minus (supplier cost + shipping you pay + flat card fee + ad cost per sale) divided by (regular price x (1 - percent fees - refund reserve)). At that discount the order leaves nothing, so set the offer below it.',
  },
  {
    question: 'Why does a 20% discount cut profit by more than 20%?',
    answer: 'The supplier cost, the shipping you pay, the flat card fee, and the ad cost do not fall when the price falls. Only the percentage fees shrink, so most of the discount comes straight out of what the order leaves.',
  },
  {
    question: 'What is break-even ROAS at the sale price?',
    answer: 'It is the sale price divided by what the order leaves before ads. If ads return less than that multiple, the sale does not cover the costs you entered. It is rounded up so it is never more generous than the real figure.',
  },
  {
    question: 'Does this predict how many orders the sale will get?',
    answer: 'No. It only shows how many times your normal orders the sale needs to keep the same total profit. It does not use sales data, ad data, or a demand forecast.',
  },
  {
    question: 'Is the result my profit?',
    answer: 'No. Taxes, duties, subscriptions, overhead, and any fee you did not enter are excluded. Treat the number as what one order leaves toward those costs.',
  },
  {
    question: 'Do I need an account?',
    answer: `No. The math runs in your browser and nothing is saved. A free account keeps 3 launch workspaces with the same costs. Pro is $${PRO_MONTHLY_PRICE_USD}/month and keeps 50.`,
  },
] as const
