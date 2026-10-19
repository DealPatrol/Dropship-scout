import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { calculateLaunchEconomics, type LaunchEconomicsInput, type LaunchEconomicsResult } from '@/lib/launch-economics'

export const PROFIT_CALCULATOR_PATH = '/tools/dropshipping-profit-calculator'

export const PROFIT_CALCULATOR_TITLE = 'Dropshipping profit calculator'
export const PROFIT_CALCULATOR_DESCRIPTION = 'Free dropshipping profit margin and break-even calculator. Enter price, shipping, fees, and ad cost per sale. No signup.'

export const PROFIT_CALCULATOR_FAQS = [
  {
    question: 'Does this calculator use live sales data?',
    answer: 'No. It uses the price, shipping, fees, refund reserve, and ad cost you type. It does not look up orders, revenue, or ad results.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No. The calculation runs in your browser and nothing is saved. Create an account when you want to keep a launch workspace. Pro checkout opens only after that account exists.',
  },
  {
    question: 'Is the remainder profit I will earn?',
    answer: 'No. Taxes, duties, overhead, a card fee different from the one you entered, and refunds you did not reserve are excluded. A positive remainder is not a forecast that the product will sell.',
  },
  {
    question: 'Which fees are filled in for me?',
    answer: 'The card-fee estimate and the platform percent start from this deployment’s settings. Percentage fees apply to the customer total, which is the product price plus shipping you charge. You can change every rate. On the hosted store, the platform fee is charged on merchandise only, not on shipping.',
  },
  {
    question: 'What is break-even ROAS here?',
    answer: 'When money is left before ads, break-even ROAS is the customer total divided by that remainder. If ads return less than that multiple, the sale does not cover the costs you entered. If nothing is left before ads, there is no break-even ROAS.',
  },
  {
    question: 'Does Pro change the math?',
    answer: `No. Pro does not change this calculation. A free account can save 3 launch workspaces that use the same math. Pro is $${PRO_MONTHLY_PRICE_USD} per month and allows 50 saved launch workspaces. Stripe Checkout opens after you create an account.`,
  },
] as const

const MAX_MONEY = 1_000_000

export interface ProfitFeeDefaults {
  paymentFeePercent: number
  paymentFeeFlat: number
  platformFeePercent: number
}

export interface ProfitQuoteFields {
  productPrice: string
  shippingCharge: string
  unitCost: string
  shippingCost: string
  paymentFeePercent: string
  paymentFeeFlat: string
  platformFeePercent: string
  returnsReservePercent: string
  adCostPerOrder: string
  testBudget: string
  targetProfitPerOrder: string
}

export interface ProfitQuote {
  productPrice: number
  shippingCharge: number
  unitCost: number
  shippingCost: number
  paymentFeePercent: number
  paymentFeeFlat: number
  platformFeePercent: number
  returnsReservePercent: number
  adCostPerOrder: number
  /** Null when the visitor left the test budget blank. */
  testBudget: number | null
  targetProfitPerOrder: number
}

export interface ProfitQuoteResult {
  customerTotal: number
  budgetEntered: boolean
  input: LaunchEconomicsInput
  economics: LaunchEconomicsResult
}

export function emptyProfitFields(fees: ProfitFeeDefaults): ProfitQuoteFields {
  return {
    productPrice: '',
    shippingCharge: '',
    unitCost: '',
    shippingCost: '',
    paymentFeePercent: String(fees.paymentFeePercent),
    paymentFeeFlat: String(fees.paymentFeeFlat),
    platformFeePercent: String(fees.platformFeePercent),
    returnsReservePercent: '0',
    adCostPerOrder: '',
    testBudget: '',
    targetProfitPerOrder: '',
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function profitFieldsFromSearch(
  params: Record<string, string | string[] | undefined>,
  fees: ProfitFeeDefaults,
): ProfitQuoteFields {
  const defaults = emptyProfitFields(fees)
  return {
    productPrice: firstParam(params.price) ?? defaults.productPrice,
    shippingCharge: firstParam(params.shipCharge) ?? defaults.shippingCharge,
    unitCost: firstParam(params.cost) ?? defaults.unitCost,
    shippingCost: firstParam(params.shipCost) ?? defaults.shippingCost,
    paymentFeePercent: firstParam(params.cardPercent) ?? defaults.paymentFeePercent,
    paymentFeeFlat: firstParam(params.cardFlat) ?? defaults.paymentFeeFlat,
    platformFeePercent: firstParam(params.platformPercent) ?? defaults.platformFeePercent,
    returnsReservePercent: firstParam(params.returns) ?? defaults.returnsReservePercent,
    adCostPerOrder: firstParam(params.ads) ?? defaults.adCostPerOrder,
    testBudget: firstParam(params.budget) ?? defaults.testBudget,
    targetProfitPerOrder: firstParam(params.target) ?? defaults.targetProfitPerOrder,
  }
}

function isFieldError(value: number | null | { error: string }): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value
}

function readAmount(value: string, label: string): number | null | { error: string } {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_MONEY) {
    return { error: `${label} has to be a non-negative amount.` }
  }
  return amount
}

function readMoney(value: string, label: string, blank: number): number | { error: string } {
  const amount = readAmount(value, label)
  if (isFieldError(amount)) return amount
  return amount ?? blank
}

function readOptionalMoney(value: string, label: string): number | null | { error: string } {
  return readAmount(value, label)
}

function readPercent(value: string, label: string, blank: number): number | { error: string } {
  const amount = readMoney(value, label, blank)
  if (isFieldError(amount)) return amount
  if (amount > 100) return { error: `${label} cannot be over 100.` }
  return amount
}

function requiredMoney(value: string, label: string, missing: string): number | { error: string } {
  const amount = readAmount(value, label)
  if (isFieldError(amount)) return amount
  if (amount === null) return { error: missing }
  return amount
}

export function parseProfitQuote(fields: ProfitQuoteFields): ProfitQuote | { error: string } {
  const productPrice = requiredMoney(fields.productPrice, 'Product price', 'Enter a product price.')
  const unitCost = requiredMoney(fields.unitCost, 'Supplier cost', 'Enter the supplier cost.')
  const shippingCharge = readMoney(fields.shippingCharge, 'Shipping you charge', 0)
  const shippingCost = readMoney(fields.shippingCost, 'Shipping you pay', 0)
  const paymentFeePercent = readPercent(fields.paymentFeePercent, 'Card fee percent', 0)
  const paymentFeeFlat = readMoney(fields.paymentFeeFlat, 'Card fee flat amount', 0)
  const platformFeePercent = readPercent(fields.platformFeePercent, 'Platform fee percent', 0)
  const returnsReservePercent = readPercent(fields.returnsReservePercent, 'Refund reserve percent', 0)
  const adCostPerOrder = readMoney(fields.adCostPerOrder, 'Ad cost per sale', 0)
  const testBudget = readOptionalMoney(fields.testBudget, 'Ad test budget')
  const targetProfitPerOrder = readMoney(fields.targetProfitPerOrder, 'Target remainder', 0)

  const parsed = [
    productPrice, unitCost, shippingCharge, shippingCost, paymentFeePercent, paymentFeeFlat,
    platformFeePercent, returnsReservePercent, adCostPerOrder, testBudget, targetProfitPerOrder,
  ]
  for (const value of parsed) {
    if (isFieldError(value)) return value
  }
  if (
    isFieldError(productPrice) || isFieldError(unitCost) || isFieldError(shippingCharge) ||
    isFieldError(shippingCost) || isFieldError(paymentFeePercent) || isFieldError(paymentFeeFlat) ||
    isFieldError(platformFeePercent) || isFieldError(returnsReservePercent) ||
    isFieldError(adCostPerOrder) || isFieldError(testBudget) || isFieldError(targetProfitPerOrder)
  ) {
    return { error: 'Enter a product price.' }
  }
  if (productPrice + shippingCharge <= 0) {
    return { error: 'Enter a product price or a shipping charge greater than zero.' }
  }

  return {
    productPrice,
    shippingCharge,
    unitCost,
    shippingCost,
    paymentFeePercent,
    paymentFeeFlat,
    platformFeePercent,
    returnsReservePercent,
    adCostPerOrder,
    testBudget,
    targetProfitPerOrder,
  }
}

/**
 * Maps a public quote onto launch-workspace economics.
 * Customer total is product price plus shipping charged. A blank test budget
 * is replaced with one ad-cost unit so an empty budget is not treated as a
 * failed test. The caller still knows the visitor left it blank.
 */
export function quoteToLaunchInput(quote: ProfitQuote): LaunchEconomicsInput {
  const adCostPerOrder = quote.adCostPerOrder
  const testBudget = quote.testBudget === null
    ? (adCostPerOrder > 0 ? adCostPerOrder : 0)
    : quote.testBudget
  return {
    sellPrice: quote.productPrice + quote.shippingCharge,
    unitCost: quote.unitCost,
    shippingCost: quote.shippingCost,
    paymentFeePercent: quote.paymentFeePercent,
    paymentFeeFlat: quote.paymentFeeFlat,
    platformFeePercent: quote.platformFeePercent,
    returnsReservePercent: quote.returnsReservePercent,
    adCostPerOrder,
    testBudget,
    targetProfitPerOrder: quote.targetProfitPerOrder,
  }
}

export function runProfitQuote(quote: ProfitQuote): ProfitQuoteResult | { error: string } {
  const input = quoteToLaunchInput(quote)
  try {
    const economics = calculateLaunchEconomics(input)
    return {
      customerTotal: input.sellPrice,
      budgetEntered: quote.testBudget !== null,
      input,
      economics,
    }
  } catch (err) {
    if (err instanceof RangeError) {
      return { error: 'Check the amounts. Prices and fee percents have to be non-negative, and percents cannot be over 100.' }
    }
    throw err
  }
}

export function profitQuoteSearch(fields: ProfitQuoteFields): string {
  const query = new URLSearchParams({
    price: fields.productPrice.trim(),
    shipCharge: fields.shippingCharge.trim(),
    cost: fields.unitCost.trim(),
    shipCost: fields.shippingCost.trim(),
    cardPercent: fields.paymentFeePercent.trim(),
    cardFlat: fields.paymentFeeFlat.trim(),
    platformPercent: fields.platformFeePercent.trim(),
    returns: fields.returnsReservePercent.trim(),
    ads: fields.adCostPerOrder.trim(),
    budget: fields.testBudget.trim(),
    target: fields.targetProfitPerOrder.trim(),
  })
  return `${PROFIT_CALCULATOR_PATH}?${query.toString()}`
}

export function isProfitQuote(value: ProfitQuote | { error: string }): value is ProfitQuote {
  return !('error' in value)
}

export function isProfitResult(value: ProfitQuoteResult | { error: string }): value is ProfitQuoteResult {
  return !('error' in value)
}
