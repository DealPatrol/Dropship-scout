import { calculatePayoutSplit } from '@/lib/commerce/payout-split'
import { dollarsToCents } from '@/lib/commerce/money'

export const IDEA_CHECK_DEFAULTS = {
  platformFeeBps: 500,
  stripeFeeBps: 290,
  stripeFeeFixedCents: 30,
} as const

export type SimilarListings = 'unchecked' | 'few' | 'many'
export type SecondSupplier = 'unchecked' | 'yes' | 'no'

export interface IdeaCheckInput {
  name: string
  cost: number
  price: number
  shippingCost: number
  shippingCharge: number
  shipDays: number
  similarListings: SimilarListings
  secondSupplier: SecondSupplier
  sampleOrdered: boolean
}

export interface IdeaNote {
  tone: 'ok' | 'warn' | 'stop'
  text: string
}

export interface IdeaCheckResult {
  name: string
  viable: boolean
  customerPaysCents: number
  supplierCostCents: number
  cardFeeCents: number
  platformFeeCents: number
  remainderCents: number
  notes: IdeaNote[]
}

export interface IdeaCheckFees {
  platformFeeBps: number
  stripeFeeBps: number
  stripeFeeFixedCents: number
}

function listingsNote(value: SimilarListings): IdeaNote {
  switch (value) {
    case 'unchecked':
      return { tone: 'warn', text: 'You have not checked how many similar listings a buyer would see. Search the exact item on the store you plan to use before you buy ads.' }
    case 'few':
      return { tone: 'ok', text: 'You saw few similar listings. Confirm that on the store you will sell from, then make the first photo specific to one buyer.' }
    case 'many':
      return { tone: 'warn', text: 'You saw many similar listings. The test is whether your photo, bundle, or buyer is different. A crowded page is not a sales figure.' }
    default: {
      const exhaustive: never = value
      return exhaustive
    }
  }
}

function supplierNote(value: SecondSupplier): IdeaNote {
  switch (value) {
    case 'unchecked':
      return { tone: 'warn', text: 'You have not looked for a second supplier. One supplier is a single week of failed orders if they go quiet.' }
    case 'yes':
      return { tone: 'ok', text: 'A second supplier is named. Ask both for the same variant, ship window, and countries they will not ship to.' }
    case 'no':
      return { tone: 'warn', text: 'There is no second supplier yet. Keep the first ad test small until you know what happens if this one stops shipping.' }
    default: {
      const exhaustive: never = value
      return exhaustive
    }
  }
}

export function checkProductIdea(input: IdeaCheckInput, fees: IdeaCheckFees = IDEA_CHECK_DEFAULTS): IdeaCheckResult | { error: string } {
  const name = input.name.trim().slice(0, 80)
  const priceCents = dollarsToCents(input.price)
  const chargeCents = dollarsToCents(input.shippingCharge)
  const costCents = dollarsToCents(input.cost)
  const shipCostCents = dollarsToCents(input.shippingCost)
  if (
    priceCents === null || chargeCents === null || costCents === null || shipCostCents === null ||
    priceCents > 100_000_00 || costCents > 100_000_00
  ) {
    return { error: 'Enter supplier cost and customer price as non-negative amounts.' }
  }
  if (!Number.isInteger(input.shipDays) || input.shipDays < 0 || input.shipDays > 120) {
    return { error: 'Ship time has to be a whole number of days from 0 to 120.' }
  }

  const grossCents = priceCents + chargeCents
  const supplierCostCents = costCents + shipCostCents
  const cardFeeCents = Math.round((grossCents * fees.stripeFeeBps) / 10_000) + fees.stripeFeeFixedCents
  const split = calculatePayoutSplit({
    grossCents,
    merchandiseCents: priceCents,
    stripeFeeCents: cardFeeCents,
    platformFeeBps: fees.platformFeeBps,
    suppliers: [{ id: 'idea', settlement: 'platform_invoice', costCents: supplierCostCents }],
  })

  const notes: IdeaNote[] = []
  if (!split.viable) {
    notes.push({
      tone: 'stop',
      text: 'This price does not leave a remainder after supplier cost, the estimated card fee, and the platform fee. Change the price or the cost before you advertise.',
    })
  } else if (split.sellerTransferCents < 300) {
    notes.push({
      tone: 'warn',
      text: 'The remainder clears the fee floor and is still thin before ads and refunds. Treat that as a reason to keep the test small, not as a profit forecast.',
    })
  } else {
    notes.push({
      tone: 'ok',
      text: 'The price clears supplier cost, the estimated card fee, and the platform fee. Ads and refunds are not in this remainder.',
    })
  }

  if (input.shipDays > 14) {
    notes.push({ tone: 'warn', text: 'A ship window longer than two weeks has to be written on the page. Do not promise a faster date than the supplier gave you.' })
  } else if (input.shipDays > 7) {
    notes.push({ tone: 'warn', text: 'Put the ship window on the product page. A week-plus delivery is part of the offer.' })
  } else {
    notes.push({ tone: 'ok', text: 'The ship window you entered is a week or less. Confirm it with the supplier before you publish it.' })
  }

  notes.push(listingsNote(input.similarListings))
  notes.push(supplierNote(input.secondSupplier))
  notes.push(input.sampleOrdered
    ? { tone: 'ok', text: 'You ordered a sample. Compare it with the photo you plan to use, and keep the variant name in your notes.' }
    : { tone: 'warn', text: 'Order one sample to your own address before you scale an ad. The page should match the item that arrives.' })

  return {
    name,
    viable: split.viable,
    customerPaysCents: split.viable || split.grossCents > 0 ? grossCents : grossCents,
    supplierCostCents,
    cardFeeCents: split.stripeFeeCents,
    platformFeeCents: split.platformFeeCents,
    remainderCents: split.sellerTransferCents,
    notes,
  }
}

export function isIdeaCheckResult(value: IdeaCheckResult | { error: string }): value is IdeaCheckResult {
  return !('error' in value)
}

export interface IdeaFormFields {
  name: string
  cost: string
  price: string
  shippingCost: string
  shippingCharge: string
  shipDays: string
  similarListings: SimilarListings
  secondSupplier: SecondSupplier
  sampleOrdered: boolean
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function listingsParam(value: string | undefined): SimilarListings {
  switch (value) {
    case 'few':
    case 'many':
    case 'unchecked':
      return value
    default:
      return 'unchecked'
  }
}

function supplierParam(value: string | undefined): SecondSupplier {
  switch (value) {
    case 'yes':
    case 'no':
    case 'unchecked':
      return value
    default:
      return 'unchecked'
  }
}

/** Reads a shareable idea-checker URL. A missing price means the visitor has not run a check. */
export function ideaQueryFromSearch(params: Record<string, string | string[] | undefined>): {
  fields: IdeaFormFields
  result: IdeaCheckResult | { error: string } | null
} {
  const fields: IdeaFormFields = {
    name: firstParam(params.name) ?? '',
    cost: firstParam(params.cost) ?? '',
    price: firstParam(params.price) ?? '',
    shippingCost: firstParam(params.shipCost) ?? '0',
    shippingCharge: firstParam(params.shipCharge) ?? '0',
    shipDays: firstParam(params.days) ?? '10',
    similarListings: listingsParam(firstParam(params.listings)),
    secondSupplier: supplierParam(firstParam(params.supplier)),
    sampleOrdered: firstParam(params.sample) === '1',
  }
  if (firstParam(params.price) === undefined) return { fields, result: null }
  const cost = fields.cost.trim() === '' ? Number.NaN : Number(fields.cost)
  const price = fields.price.trim() === '' ? Number.NaN : Number(fields.price)
  const shippingCost = fields.shippingCost.trim() === '' ? Number.NaN : Number(fields.shippingCost)
  const shippingCharge = fields.shippingCharge.trim() === '' ? Number.NaN : Number(fields.shippingCharge)
  return {
    fields,
    result: checkProductIdea({
      name: fields.name,
      cost,
      price,
      shippingCost,
      shippingCharge,
      shipDays: Number(fields.shipDays),
      similarListings: fields.similarListings,
      secondSupplier: fields.secondSupplier,
      sampleOrdered: fields.sampleOrdered,
    }),
  }
}
