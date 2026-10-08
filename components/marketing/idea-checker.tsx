'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WatchForm } from '@/components/marketing/watch-form'
import { formatCents } from '@/lib/commerce/money'
import {
  checkProductIdea,
  isIdeaCheckResult,
  type IdeaCheckFees,
  type IdeaCheckResult,
  type IdeaFormFields,
  type SecondSupplier,
  type SimilarListings,
} from '@/lib/marketing/idea-check'

const fieldClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm'

function listingsFrom(value: string): SimilarListings {
  switch (value) {
    case 'few':
    case 'many':
    case 'unchecked':
      return value
    default:
      return 'unchecked'
  }
}

function supplierFrom(value: string): SecondSupplier {
  switch (value) {
    case 'yes':
    case 'no':
    case 'unchecked':
      return value
    default:
      return 'unchecked'
  }
}

function amount(value: string): number {
  if (value.trim() === '') return Number.NaN
  return Number(value)
}

function shareQuery(input: {
  name: string
  cost: string
  price: string
  shippingCost: string
  shippingCharge: string
  shipDays: string
  similarListings: SimilarListings
  secondSupplier: SecondSupplier
  sampleOrdered: boolean
}): string {
  const query = new URLSearchParams({
    name: input.name.trim().slice(0, 80),
    cost: input.cost,
    price: input.price,
    shipCost: input.shippingCost,
    shipCharge: input.shippingCharge,
    days: input.shipDays,
    listings: input.similarListings,
    supplier: input.secondSupplier,
    sample: input.sampleOrdered ? '1' : '0',
  })
  return `/research/idea-checker?${query.toString()}`
}

export function IdeaChecker({
  fields,
  fees,
  initialResult,
  initialError,
}: {
  fields: IdeaFormFields
  fees: IdeaCheckFees
  initialResult: IdeaCheckResult | null
  initialError: string | null
}) {
  const router = useRouter()
  const [name, setName] = useState(fields.name)
  const [cost, setCost] = useState(fields.cost)
  const [price, setPrice] = useState(fields.price)
  const [shippingCost, setShippingCost] = useState(fields.shippingCost)
  const [shippingCharge, setShippingCharge] = useState(fields.shippingCharge)
  const [shipDays, setShipDays] = useState(fields.shipDays)
  const [similarListings, setSimilarListings] = useState<SimilarListings>(fields.similarListings)
  const [secondSupplier, setSecondSupplier] = useState<SecondSupplier>(fields.secondSupplier)
  const [sampleOrdered, setSampleOrdered] = useState(fields.sampleOrdered)
  const [error, setError] = useState<string | null>(initialError)
  const [result, setResult] = useState<IdeaCheckResult | null>(initialResult)
  const [sharePath, setSharePath] = useState<string | null>(initialResult ? shareQuery(fields) : null)

  const shown = result

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const days = Number(shipDays)
    const checked = checkProductIdea({
      name,
      cost: amount(cost),
      price: amount(price),
      shippingCost: amount(shippingCost),
      shippingCharge: amount(shippingCharge),
      shipDays: days,
      similarListings,
      secondSupplier,
      sampleOrdered,
    }, fees)
    if (!isIdeaCheckResult(checked)) {
      setError(checked.error)
      setResult(null)
      return
    }
    setError(null)
    setResult(checked)
    const next = shareQuery({
      name: checked.name,
      cost,
      price,
      shippingCost,
      shippingCharge,
      shipDays: String(days),
      similarListings,
      secondSupplier,
      sampleOrdered,
    })
    setSharePath(next)
    router.replace(next, { scroll: false })
  }

  async function copyLink() {
    if (!sharePath || typeof window === 'undefined') return
    await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`)
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            Product name
            <input className={fieldClass} value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder="Optional label for the share link" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Supplier cost (USD)
            <input className={fieldClass} inputMode="decimal" required value={cost} onChange={event => setCost(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Customer price (USD)
            <input className={fieldClass} inputMode="decimal" required value={price} onChange={event => setPrice(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Shipping you pay
            <input className={fieldClass} inputMode="decimal" required value={shippingCost} onChange={event => setShippingCost(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Shipping you charge
            <input className={fieldClass} inputMode="decimal" required value={shippingCharge} onChange={event => setShippingCharge(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Ship window (days)
            <input className={fieldClass} inputMode="numeric" required value={shipDays} onChange={event => setShipDays(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Similar listings
            <select className={fieldClass} value={similarListings} onChange={event => setSimilarListings(listingsFrom(event.target.value))}>
              <option value="unchecked">Not checked yet</option>
              <option value="few">Few</option>
              <option value="many">Many</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Second supplier
            <select className={fieldClass} value={secondSupplier} onChange={event => setSecondSupplier(supplierFrom(event.target.value))}>
              <option value="unchecked">Not checked yet</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={sampleOrdered} onChange={event => setSampleOrdered(event.target.checked)} />
            I ordered a sample to my own address
          </label>
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Fee floor used here: {fees.platformFeeBps / 100}% of merchandise and a card-fee estimate of {fees.stripeFeeBps / 100}% plus {formatCents(fees.stripeFeeFixedCents)}. This deployment can change those rates. Ads and refunds are not included.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <button type="submit" className="mt-4 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Check this idea
        </button>
      </form>

      {shown && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-live="polite">
          <h2 className="text-2xl font-semibold">{shown.name || 'Idea check'}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {shown.viable ? 'The price clears the fee floor used here.' : 'The price does not clear the fee floor used here.'}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Customer pays</dt>
              <dd className="font-medium">{formatCents(shown.customerPaysCents)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Supplier cost</dt>
              <dd className="font-medium">{formatCents(shown.supplierCostCents)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Estimated card fee</dt>
              <dd className="font-medium">{formatCents(shown.cardFeeCents)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Platform fee</dt>
              <dd className="font-medium">{formatCents(shown.platformFeeCents)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Remainder before ads and refunds</dt>
              <dd className="font-medium">{formatCents(shown.remainderCents)}</dd>
            </div>
          </dl>
          <ul className="mt-4 flex flex-col gap-2">
            {shown.notes.map(note => (
              <li key={note.text} className="text-sm text-muted-foreground leading-relaxed">{note.text}</li>
            ))}
          </ul>
          {sharePath && (
            <button type="button" onClick={() => void copyLink()} className="mt-4 text-sm text-primary hover:underline">
              Copy share link
            </button>
          )}
          <p className="mt-6 text-sm leading-relaxed">
            Want higher limits on saved products and hosted listings?{' '}
            <Link href="/pricing" className="text-primary hover:underline">Compare Free and Pro</Link>
            . The checker stays free either way.
          </p>
        </section>
      )}

      <WatchForm source="idea-checker" />
    </div>
  )
}
