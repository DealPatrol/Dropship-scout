'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FUNNEL, trackFunnel } from '@/lib/analytics/track-funnel'
import { formatCents } from '@/lib/commerce/money'
import {
  comparisonHeading,
  comparisonNotes,
  comparisonSignal,
  coverageFrom,
  ideaCheckerSearch,
  isSupplierComparison,
  otherSide,
  parseSupplierComparison,
  profitCalculatorSearch,
  sideById,
  supplierComparisonSearch,
  type Coverage,
  type SideId,
  type SupplierCompareFields,
  type SupplierComparison,
  type SupplierSide,
  type SupplierSideFields,
} from '@/lib/marketing/supplier-comparison'

const fieldClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm'

function dollars(value: number): string {
  return formatCents(Math.round(value * 100))
}

function coverageLabel(value: Coverage): string {
  switch (value) {
    case 'yes':
      return 'Ships to this country'
    case 'no':
      return 'Does not ship to this country'
    case 'unchecked':
      return 'Country not confirmed'
    default: {
      const exhaustive: never = value
      return exhaustive
    }
  }
}

function legend(id: SideId): string {
  switch (id) {
    case 'a':
      return 'First quote'
    case 'b':
      return 'Second quote'
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}

function trackUse(result: SupplierComparison) {
  trackFunnel(FUNNEL.toolUsed, {
    tool: 'supplier-comparison',
    path: window.location.pathname,
    result: comparisonSignal(result.shape),
  })
}

function QuoteFields({
  id,
  fields,
  onChange,
}: {
  id: SideId
  fields: SupplierSideFields
  onChange: (patch: Partial<SupplierSideFields>) => void
}) {
  return (
    <fieldset className="rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-medium">{legend(id)}</legend>
      <div className="mt-3 grid gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Name
          <input className={fieldClass} value={fields.label} maxLength={40} placeholder="Optional" onChange={event => onChange({ label: event.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Product cost (USD)
          <input className={fieldClass} inputMode="decimal" required value={fields.productCost} onChange={event => onChange({ productCost: event.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Shipping you pay (USD)
          <input className={fieldClass} inputMode="decimal" required value={fields.shippingCost} onChange={event => onChange({ shippingCost: event.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Processing days
          <input className={fieldClass} inputMode="numeric" required value={fields.processingDays} onChange={event => onChange({ processingDays: event.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Transit days
          <input className={fieldClass} inputMode="numeric" required value={fields.transitDays} onChange={event => onChange({ transitDays: event.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Ships to the country you sell in
          <select className={fieldClass} value={fields.shipsToCountry} onChange={event => onChange({ shipsToCountry: coverageFrom(event.target.value) })}>
            <option value="unchecked">Not confirmed yet</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
    </fieldset>
  )
}

function QuoteResult({
  quote,
  fields,
  other,
}: {
  quote: SupplierSide
  fields: SupplierSideFields
  other: SupplierSide
}) {
  const open = quote.shipsToCountry !== 'no'
  return (
    <article className="rounded-lg border border-border p-4">
      <h3 className="font-semibold">{quote.label}</h3>
      <dl className="mt-3 grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Landed cost</dt>
          <dd className="font-medium">{dollars(quote.landedCost)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ship window</dt>
          <dd className="font-medium">{quote.shipDays} days ({quote.processingDays} processing + {quote.transitDays} transit)</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">This country</dt>
          <dd className="font-medium">{coverageLabel(quote.shipsToCountry)}</dd>
        </div>
      </dl>
      {open && (
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          <li>
            <Link
              href={ideaCheckerSearch({
                label: quote.label,
                productCost: fields.productCost,
                shippingCost: fields.shippingCost,
                shipDays: quote.shipDays,
                otherCoverage: other.shipsToCountry,
              })}
              className="text-primary hover:underline"
            >
              Check {quote.label} in the idea checker
            </Link>
          </li>
          <li>
            <Link href={profitCalculatorSearch(fields)} className="text-primary hover:underline">
              Price {quote.label} in the profit calculator
            </Link>
          </li>
        </ul>
      )}
    </article>
  )
}

export function SupplierComparison({
  fields: initialFields,
  initialResult,
  initialError,
}: {
  fields: SupplierCompareFields
  initialResult: SupplierComparison | null
  initialError: string | null
}) {
  const router = useRouter()
  const trackedInitial = useRef(false)
  const [fields, setFields] = useState(initialFields)
  const [error, setError] = useState<string | null>(initialError)
  const [result, setResult] = useState<SupplierComparison | null>(initialResult)

  useEffect(() => {
    if (!initialResult || trackedInitial.current) return
    trackedInitial.current = true
    trackUse(initialResult)
  }, [initialResult])

  function update(id: SideId, patch: Partial<SupplierSideFields>) {
    setFields(current => {
      switch (id) {
        case 'a':
          return { ...current, a: { ...current.a, ...patch } }
        case 'b':
          return { ...current, b: { ...current.b, ...patch } }
        default: {
          const exhaustive: never = id
          return exhaustive
        }
      }
    })
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const outcome = parseSupplierComparison(fields)
    if (!isSupplierComparison(outcome)) {
      setError(outcome.error)
      setResult(null)
      return
    }
    setError(null)
    setResult(outcome)
    trackUse(outcome)
    router.replace(supplierComparisonSearch(fields), { scroll: false })
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <QuoteFields id="a" fields={fields.a} onChange={patch => update('a', patch)} />
          <QuoteFields id="b" fields={fields.b} onChange={patch => update('b', patch)} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Use one variant and one destination. Landed cost is the product cost plus the shipping you pay. Ship days are processing plus transit. A supplier who does not serve the country is out for that destination, even with a lower cost. Leave a name blank to label the quote Supplier A or Supplier B.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <button type="submit" className="mt-4 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Compare quotes
        </button>
      </form>

      {result && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-live="polite">
          <h2 className="text-2xl font-semibold">{comparisonHeading(result)}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            These notes use the amounts you entered. They are not a forecast of refunds, ad results, or carrier performance.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <QuoteResult quote={result.a} fields={fields.a} other={sideById(result, otherSide('a'))} />
            <QuoteResult quote={result.b} fields={fields.b} other={sideById(result, otherSide('b'))} />
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {comparisonNotes(result).map(note => (
              <li key={note} className="text-sm text-muted-foreground leading-relaxed">{note}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
