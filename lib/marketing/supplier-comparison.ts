import { formatCents } from '@/lib/commerce/money'
import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { PROFIT_CALCULATOR_PATH } from '@/lib/marketing/profit-calculator'

export const SUPPLIER_COMPARISON_PATH = '/tools/dropshipping-supplier-comparison'
export const IDEA_CHECKER_PATH = '/research/idea-checker'

export const SUPPLIER_COMPARISON_TITLE = 'Dropshipping supplier comparison'
export const SUPPLIER_COMPARISON_DESCRIPTION = 'Free dropshipping supplier comparison. Compare landed cost, processing days, transit days, and country coverage. No signup.'

export const SUPPLIER_COMPARISON_FAQS = [
  {
    question: 'Does this comparison use live shipping data?',
    answer: 'No. It uses the product cost, shipping you pay, processing days, transit days, and country answer you type. It does not look up carrier scans, order volume, or a supplier rating.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No. The comparison runs in your browser and nothing is saved. Create an account when you want to keep a launch workspace. Pro checkout opens only after that account exists.',
  },
  {
    question: 'What is landed cost here?',
    answer: 'Landed cost is the supplier product cost plus the shipping you pay to one country. It is not the price the customer pays, and it does not include ads, refunds, or card fees.',
  },
  {
    question: 'How are ship days counted?',
    answer: 'Ship days are processing days plus transit days. A window longer than 7 days should go on the product page. A window longer than 14 days should be stated before someone buys. The idea checker uses those same cutoffs. They are disclosure rules, not a delivery guarantee.',
  },
  {
    question: 'Does Pro change the comparison?',
    answer: `No. Pro does not change this math. A free account can save 3 launch workspaces. Pro is $${PRO_MONTHLY_PRICE_USD} per month and allows 50 saved launch workspaces. Stripe Checkout opens after you create an account.`,
  },
] as const

const MAX_MONEY = 1_000_000
const MAX_DAYS = 120
const MAX_LABEL = 40

export type Coverage = 'yes' | 'no' | 'unchecked'
export type SideId = 'a' | 'b'

export interface SupplierSideFields {
  label: string
  productCost: string
  shippingCost: string
  processingDays: string
  transitDays: string
  shipsToCountry: Coverage
}

export interface SupplierCompareFields {
  a: SupplierSideFields
  b: SupplierSideFields
}

export interface SupplierQuote {
  label: string
  productCost: number
  shippingCost: number
  processingDays: number
  transitDays: number
  shipsToCountry: Coverage
}

export interface SupplierSide extends SupplierQuote {
  landedCost: number
  shipDays: number
}

export type ComparisonShape =
  | { kind: 'both-excluded' }
  | { kind: 'one-excluded'; kept: SideId }
  | { kind: 'tie' }
  | { kind: 'tradeoff'; cheaper: SideId; faster: SideId }
  | { kind: 'clear'; winner: SideId; onCost: boolean; onTime: boolean }

export interface SupplierComparison {
  a: SupplierSide
  b: SupplierSide
  cheaper: SideId | 'tie'
  faster: SideId | 'tie'
  shape: ComparisonShape
}

export function emptySupplierSide(): SupplierSideFields {
  return {
    label: '',
    productCost: '',
    shippingCost: '',
    processingDays: '',
    transitDays: '',
    shipsToCountry: 'unchecked',
  }
}

export function emptySupplierFields(): SupplierCompareFields {
  return { a: emptySupplierSide(), b: emptySupplierSide() }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function coverageFrom(value: string | undefined): Coverage {
  switch (value) {
    case 'yes':
    case 'no':
    case 'unchecked':
      return value
    default:
      return 'unchecked'
  }
}

function sideFromSearch(
  prefix: SideId,
  params: Record<string, string | string[] | undefined>,
): SupplierSideFields {
  return {
    label: firstParam(params[`${prefix}Name`]) ?? '',
    productCost: firstParam(params[`${prefix}Cost`]) ?? '',
    shippingCost: firstParam(params[`${prefix}Ship`]) ?? '',
    processingDays: firstParam(params[`${prefix}Handle`]) ?? '',
    transitDays: firstParam(params[`${prefix}Transit`]) ?? '',
    shipsToCountry: coverageFrom(firstParam(params[`${prefix}Coverage`])),
  }
}

/** A shared comparison URL includes `aCost`, even when the value is blank. */
export function supplierComparisonRequested(
  params: Record<string, string | string[] | undefined>,
): boolean {
  return firstParam(params.aCost) !== undefined
}

export function supplierFieldsFromSearch(
  params: Record<string, string | string[] | undefined>,
): SupplierCompareFields {
  return {
    a: sideFromSearch('a', params),
    b: sideFromSearch('b', params),
  }
}

function isFieldError(value: number | { error: string }): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value
}

function readMoney(value: string, label: string): number | { error: string } {
  const trimmed = value.trim()
  if (trimmed === '') return { error: `Enter ${label}.` }
  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_MONEY) {
    return { error: `${label} has to be a non-negative amount.` }
  }
  return amount
}

function readDays(value: string, label: string): number | { error: string } {
  const trimmed = value.trim()
  if (trimmed === '') return { error: `Enter ${label}.` }
  if (!/^\d+$/.test(trimmed)) return { error: `${label} has to be a whole number of days.` }
  const days = Number(trimmed)
  if (days > MAX_DAYS) return { error: `${label} cannot be over ${MAX_DAYS}.` }
  return days
}

function resolveLabel(value: string, fallback: string): string {
  const trimmed = value.trim().slice(0, MAX_LABEL)
  return trimmed || fallback
}

function parseSide(fields: SupplierSideFields, fallback: string): SupplierQuote | { error: string } {
  const label = resolveLabel(fields.label, fallback)
  const productCost = readMoney(fields.productCost, `the product cost for ${label}`)
  const shippingCost = readMoney(fields.shippingCost, `the shipping you pay for ${label}`)
  const processingDays = readDays(fields.processingDays, `processing days for ${label}`)
  const transitDays = readDays(fields.transitDays, `transit days for ${label}`)
  const parsed = [productCost, shippingCost, processingDays, transitDays]
  for (const value of parsed) {
    if (isFieldError(value)) return value
  }
  if (
    isFieldError(productCost) || isFieldError(shippingCost) ||
    isFieldError(processingDays) || isFieldError(transitDays)
  ) {
    return { error: `Enter the product cost for ${label}.` }
  }
  if (processingDays + transitDays > MAX_DAYS) {
    return { error: `${label} total ship days cannot be over ${MAX_DAYS}.` }
  }
  return {
    label,
    productCost,
    shippingCost,
    processingDays,
    transitDays,
    shipsToCountry: fields.shipsToCountry,
  }
}

function present(quote: SupplierQuote): SupplierSide {
  return {
    ...quote,
    landedCost: quote.productCost + quote.shippingCost,
    shipDays: quote.processingDays + quote.transitDays,
  }
}

function cheaperOf(a: SupplierSide, b: SupplierSide): SideId | 'tie' {
  if (a.landedCost < b.landedCost) return 'a'
  if (b.landedCost < a.landedCost) return 'b'
  return 'tie'
}

function fasterOf(a: SupplierSide, b: SupplierSide): SideId | 'tie' {
  if (a.shipDays < b.shipDays) return 'a'
  if (b.shipDays < a.shipDays) return 'b'
  return 'tie'
}

function shapeOf(
  a: SupplierSide,
  b: SupplierSide,
  cheaper: SideId | 'tie',
  faster: SideId | 'tie',
): ComparisonShape {
  if (a.shipsToCountry === 'no' && b.shipsToCountry === 'no') return { kind: 'both-excluded' }
  if (a.shipsToCountry === 'no') return { kind: 'one-excluded', kept: 'b' }
  if (b.shipsToCountry === 'no') return { kind: 'one-excluded', kept: 'a' }
  if (cheaper !== 'tie' && (faster === 'tie' || faster === cheaper)) {
    return { kind: 'clear', winner: cheaper, onCost: true, onTime: faster === cheaper }
  }
  if (faster !== 'tie' && cheaper === 'tie') {
    return { kind: 'clear', winner: faster, onCost: false, onTime: true }
  }
  if (cheaper !== 'tie' && faster !== 'tie' && cheaper !== faster) {
    return { kind: 'tradeoff', cheaper, faster }
  }
  return { kind: 'tie' }
}

export function compareSuppliers(a: SupplierQuote, b: SupplierQuote): SupplierComparison {
  const left = present(a)
  const right = present(b)
  const cheaper = cheaperOf(left, right)
  const faster = fasterOf(left, right)
  return {
    a: left,
    b: right,
    cheaper,
    faster,
    shape: shapeOf(left, right, cheaper, faster),
  }
}

export function parseSupplierComparison(fields: SupplierCompareFields): SupplierComparison | { error: string } {
  const a = parseSide(fields.a, 'Supplier A')
  if ('error' in a) return a
  const b = parseSide(fields.b, 'Supplier B')
  if ('error' in b) return b
  if (a.label.toLowerCase() === b.label.toLowerCase()) {
    return { error: 'Give the two suppliers different names, or leave both names blank.' }
  }
  return compareSuppliers(a, b)
}

export function isSupplierComparison(value: SupplierComparison | { error: string }): value is SupplierComparison {
  return !('error' in value)
}

export function supplierComparisonSearch(fields: SupplierCompareFields): string {
  const query = new URLSearchParams({
    aName: fields.a.label.trim(),
    aCost: fields.a.productCost.trim(),
    aShip: fields.a.shippingCost.trim(),
    aHandle: fields.a.processingDays.trim(),
    aTransit: fields.a.transitDays.trim(),
    aCoverage: fields.a.shipsToCountry,
    bName: fields.b.label.trim(),
    bCost: fields.b.productCost.trim(),
    bShip: fields.b.shippingCost.trim(),
    bHandle: fields.b.processingDays.trim(),
    bTransit: fields.b.transitDays.trim(),
    bCoverage: fields.b.shipsToCountry,
  })
  return `${SUPPLIER_COMPARISON_PATH}?${query.toString()}`
}

export function sideById(result: SupplierComparison, id: SideId): SupplierSide {
  switch (id) {
    case 'a':
      return result.a
    case 'b':
      return result.b
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}

export function otherSide(id: SideId): SideId {
  switch (id) {
    case 'a':
      return 'b'
    case 'b':
      return 'a'
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}

function money(amount: number): string {
  return formatCents(Math.round(amount * 100))
}

function dayLabel(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

export function shipWindowSentence(days: number): string {
  if (days > 14) {
    return `A ${days}-day window is longer than two weeks. Say that on the page before someone buys. The idea checker uses the same cutoff. It is a disclosure rule, not a delivery guarantee.`
  }
  if (days > 7) {
    return `A ${days}-day window is longer than a week. Put that window on the product page.`
  }
  return `A ${days}-day window is a week or less. Confirm it with the supplier before you publish it.`
}

export function comparisonSignal(shape: ComparisonShape): 'excluded' | 'tie' | 'tradeoff' | 'clear' {
  switch (shape.kind) {
    case 'both-excluded':
    case 'one-excluded':
      return 'excluded'
    case 'tie':
      return 'tie'
    case 'tradeoff':
      return 'tradeoff'
    case 'clear':
      return 'clear'
    default: {
      const exhaustive: never = shape
      return exhaustive
    }
  }
}

export function comparisonHeading(result: SupplierComparison): string {
  const shape = result.shape
  switch (shape.kind) {
    case 'both-excluded':
      return 'Neither supplier ships to this country'
    case 'one-excluded': {
      const kept = sideById(result, shape.kept)
      const dropped = sideById(result, otherSide(shape.kept))
      if (kept.shipsToCountry === 'unchecked') {
        return `${dropped.label} does not ship here. ${kept.label} has not confirmed this country`
      }
      return `Only ${kept.label} can ship to this country`
    }
    case 'tie':
      return 'These quotes match on landed cost and ship days'
    case 'tradeoff':
      return `${sideById(result, shape.cheaper).label} costs less. ${sideById(result, shape.faster).label} is faster.`
    case 'clear': {
      const name = sideById(result, shape.winner).label
      if (shape.onCost && shape.onTime) return `${name} is cheaper and faster on these quotes`
      if (shape.onCost) return `${name} costs less, and the ship windows match`
      return `${name} is faster, and the landed costs match`
    }
    default: {
      const exhaustive: never = shape
      return exhaustive
    }
  }
}

function gapSentence(result: SupplierComparison, shape: Extract<ComparisonShape, { kind: 'clear' }>): string {
  const winner = sideById(result, shape.winner)
  const other = sideById(result, otherSide(shape.winner))
  const dollars = money(Math.abs(winner.landedCost - other.landedCost))
  const days = Math.abs(winner.shipDays - other.shipDays)
  if (shape.onCost && shape.onTime) {
    return `${winner.label} is ${dollars} cheaper and ${dayLabel(days)} faster than ${other.label} on the numbers you entered.`
  }
  if (shape.onCost) {
    return `${winner.label} is ${dollars} cheaper, and both ship windows are ${dayLabel(winner.shipDays)}.`
  }
  return `${winner.label} is ${dayLabel(days)} faster, and both landed costs are ${money(winner.landedCost)}.`
}

export function comparisonNotes(result: SupplierComparison): string[] {
  const notes: string[] = []
  const shape = result.shape
  switch (shape.kind) {
    case 'both-excluded':
      notes.push('Both suppliers said they do not ship to this country. Ask for a country they serve, or bring in another quote.')
      break
    case 'one-excluded': {
      const kept = sideById(result, shape.kept)
      const dropped = sideById(result, otherSide(shape.kept))
      notes.push(kept.shipsToCountry === 'unchecked'
        ? `${dropped.label} does not ship to this country. ${kept.label} has not confirmed this country yet.`
        : `${dropped.label} does not ship to this country. ${kept.label} is the quote still in play for this destination.`)
      break
    }
    case 'tie':
      notes.push('Landed cost and total ship days match. Ask which supplier has this variant and will send a sample to your address.')
      break
    case 'tradeoff': {
      const cheap = sideById(result, shape.cheaper)
      const fast = sideById(result, shape.faster)
      const dollars = money(Math.abs(cheap.landedCost - fast.landedCost))
      const days = Math.abs(cheap.shipDays - fast.shipDays)
      notes.push(`${cheap.label} landed cost is ${dollars} lower. ${fast.label} is ${dayLabel(days)} faster.`)
      notes.push('Print the ship window of the supplier whose quote you keep. The page should show that supplier’s days.')
      break
    }
    case 'clear':
      notes.push(gapSentence(result, shape))
      break
    default: {
      const exhaustive: never = shape
      return [exhaustive]
    }
  }

  const open = [result.a, result.b].filter(quote => quote.shipsToCountry !== 'no')
  if (open.length === 2 && open[0].shipDays === open[1].shipDays) {
    notes.push(`Both quotes are ${dayLabel(open[0].shipDays)}. ${shipWindowSentence(open[0].shipDays)}`)
  } else {
    for (const quote of open) {
      notes.push(`${quote.label}: ${shipWindowSentence(quote.shipDays)}`)
    }
  }
  for (const quote of [result.a, result.b]) {
    if (quote.shipsToCountry === 'unchecked') {
      notes.push(`You have not confirmed that ${quote.label} ships to this country.`)
    }
  }
  if (shape.kind !== 'both-excluded') {
    notes.push('Bring the quote you keep into the idea checker and add the price you want to charge.')
  }
  return notes
}

export function ideaCheckerSearch(input: {
  label: string
  productCost: string
  shippingCost: string
  shipDays: number
  otherCoverage: Coverage
}): string {
  const supplier = coverageFrom(input.otherCoverage)
  const query = new URLSearchParams({
    name: input.label.trim().slice(0, MAX_LABEL),
    cost: input.productCost.trim(),
    shipCost: input.shippingCost.trim(),
    days: String(input.shipDays),
    supplier,
  })
  return `${IDEA_CHECKER_PATH}?${query.toString()}`
}

export function profitCalculatorSearch(fields: SupplierSideFields): string {
  const query = new URLSearchParams({
    cost: fields.productCost.trim(),
    shipCost: fields.shippingCost.trim(),
  })
  return `${PROFIT_CALCULATOR_PATH}?${query.toString()}`
}
