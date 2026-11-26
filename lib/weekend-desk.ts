import { NICHE_MAP, PRODUCTS } from '@/lib/merchandising/data'
import type { CatalogProduct } from '@/lib/merchandising/types'
import { calculateSaleDiscount, type SaleDiscountResult } from '@/lib/marketing/sale-discount'
import { platformFeeBps, stripeFeeConfig } from '@/lib/commerce/modes'

export const WEEKEND_DESK_PATH = '/tools/weekend-cash-desk'
export const WEEKEND_DESK_TITLE = 'Products that still pay at 20% off'
export const WEEKEND_DESK_H1 = 'Products that still pay at 20% off'
export const WEEKEND_DESK_DESCRIPTION =
  'Sample-catalog gifts that still leave money at 20% off under stated fees and a flat ship cost. No signup and no sales totals.'
export const WEEKEND_DESK_UPDATED = '2026-11-26'

export interface DeskAssumptions {
  paymentFeePercent: number
  paymentFeeFlat: number
  platformFeePercent: number
  returnsReservePercent: number
  adCostPerOrder: number
  saleAdCostPerOrder: number
  discountPercent: number
}

export interface WeekendPick {
  id: string
  name: string
  audience: string
  niches: string[]
  competition: string
  sampleCost: number
  samplePrice: number
  shippingPaid: number
  shippingDays: number
  salePrice: number
  saleProfit: number
  marginPercent: number
  maxDiscountPercent: number | null
  breakEvenRoas: number | null
  verdict: SaleDiscountResult['verdict']
  why: string
  shipNote: string
  listing: string
}

export interface WeekendDesk {
  assumptions: DeskAssumptions
  hold: WeekendPick[]
  stop: WeekendPick[]
}

const HOLIDAYS = new Set(['black_friday', 'thanksgiving', 'christmas'])

export function shippingForSampleCost(unitCost: number): number {
  if (unitCost <= 12) return 4
  if (unitCost <= 25) return 6
  return 12
}

export function weekendAssumptionsFromEnv(): DeskAssumptions {
  const card = stripeFeeConfig()
  return {
    paymentFeePercent: card.bps / 100,
    paymentFeeFlat: card.fixedCents / 100,
    platformFeePercent: platformFeeBps() / 100,
    returnsReservePercent: 5,
    adCostPerOrder: 8,
    saleAdCostPerOrder: 10,
    discountPercent: 20,
  }
}

function isCandidate(product: CatalogProduct): boolean {
  if (product.trend === 'declining') return false
  if (product.cost > 40) return false
  if (product.shippingDays > 14) return false
  return product.holidays.some(id => HOLIDAYS.has(id))
    || product.peakMonths.some(month => month === 11 || month === 12)
    || product.tags.includes('gift')
    || product.tags.includes('winter')
}

function why(product: CatalogProduct): string {
  if (product.holidays.includes('black_friday')) return 'The sample catalog tags this for Black Friday.'
  if (product.holidays.includes('thanksgiving')) return 'The sample catalog tags this for Thanksgiving.'
  if (product.holidays.includes('christmas')) return 'The sample catalog tags this as a Christmas item.'
  if (product.peakMonths.some(month => month === 11 || month === 12)) return 'The sample catalog marks November or December as a peak month.'
  if (product.tags.includes('winter')) return 'The sample catalog tags this as a winter item.'
  return 'The sample catalog tags this as a gift.'
}

function money(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function toPick(product: CatalogProduct, assumptions: DeskAssumptions): WeekendPick {
  const shippingPaid = shippingForSampleCost(product.cost)
  const result = calculateSaleDiscount({
    regularPrice: product.price,
    unitCost: product.cost,
    shippingCost: shippingPaid,
    paymentFeePercent: assumptions.paymentFeePercent,
    paymentFeeFlat: assumptions.paymentFeeFlat,
    platformFeePercent: assumptions.platformFeePercent,
    returnsReservePercent: assumptions.returnsReservePercent,
    adCostPerOrder: assumptions.adCostPerOrder,
    saleAdCostPerOrder: assumptions.saleAdCostPerOrder,
    discountPercent: assumptions.discountPercent,
  })
  const listing = [
    product.name,
    '',
    `For ${product.audience}.`,
    `Sample regular price ${money(product.price)}. At ${assumptions.discountPercent}% off the scenario price is ${money(result.salePrice)}. Replace both with a dated supplier quote before you publish.`,
    `Sample ship window: ${product.shippingDays} days. Put that window on the page. Do not promise delivery this weekend.`,
  ].join('\n')
  return {
    id: product.id,
    name: product.name,
    audience: product.audience,
    niches: product.niches.map(id => NICHE_MAP[id].label),
    competition: product.competition,
    sampleCost: product.cost,
    samplePrice: product.price,
    shippingPaid,
    shippingDays: product.shippingDays,
    salePrice: result.salePrice,
    saleProfit: result.saleProfit,
    marginPercent: result.tiers.find(tier => tier.discountPercent === assumptions.discountPercent)?.marginPercent ?? 0,
    maxDiscountPercent: result.maxDiscountPercent,
    breakEvenRoas: result.breakEvenRoas,
    verdict: result.verdict,
    why: why(product),
    shipNote: `Sample ship window is ${product.shippingDays} days. A Black Friday order will not arrive this weekend. For a Christmas delivery, confirm the supplier's real window still clears mid-December.`,
    listing,
  }
}

export function rankWeekendProducts(
  products: readonly CatalogProduct[],
  assumptions: DeskAssumptions,
): WeekendDesk {
  const picks = products.filter(isCandidate).map(product => toPick(product, assumptions))
  const hold = picks
    .filter(pick => pick.verdict === 'ok' || pick.verdict === 'thin')
    .sort((a, b) => b.saleProfit - a.saleProfit)
    .slice(0, 8)
  const stop = picks
    .filter(pick => pick.verdict !== 'ok' && pick.verdict !== 'thin')
    .sort((a, b) => (b.maxDiscountPercent ?? -1) - (a.maxDiscountPercent ?? -1))
    .slice(0, 8)
  return { assumptions, hold, stop }
}

export function weekendDesk(assumptions = weekendAssumptionsFromEnv()): WeekendDesk {
  return rankWeekendProducts(PRODUCTS, assumptions)
}
