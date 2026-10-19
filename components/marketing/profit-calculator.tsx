'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FUNNEL, trackFunnel } from '@/lib/analytics/track-funnel'
import { formatCents } from '@/lib/commerce/money'
import {
  isProfitQuote,
  isProfitResult,
  parseProfitQuote,
  profitQuoteSearch,
  runProfitQuote,
  type ProfitFeeDefaults,
  type ProfitQuoteFields,
  type ProfitQuoteResult,
} from '@/lib/marketing/profit-calculator'
import type { LaunchEconomicsResult } from '@/lib/launch-economics'

const fieldClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm'

function dollars(value: number): string {
  return formatCents(Math.round(value * 100))
}

function outcomeHeading(value: LaunchEconomicsResult['recommendation']): string {
  switch (value) {
    case 'stop':
      return 'These amounts do not leave a remainder'
    case 'review':
      return 'Review these amounts before you spend'
    case 'test':
      return 'These amounts leave room for a small test'
    default: {
      const exhaustive: never = value
      return exhaustive
    }
  }
}

function trackUse(result: LaunchEconomicsResult['recommendation']) {
  trackFunnel(FUNNEL.toolUsed, {
    tool: 'profit-calculator',
    path: window.location.pathname,
    result,
  })
}

export function ProfitCalculator({
  fields,
  fees,
  initialResult,
  initialError,
}: {
  fields: ProfitQuoteFields
  fees: ProfitFeeDefaults
  initialResult: ProfitQuoteResult | null
  initialError: string | null
}) {
  const router = useRouter()
  const trackedInitial = useRef(false)
  const [productPrice, setProductPrice] = useState(fields.productPrice)
  const [shippingCharge, setShippingCharge] = useState(fields.shippingCharge)
  const [unitCost, setUnitCost] = useState(fields.unitCost)
  const [shippingCost, setShippingCost] = useState(fields.shippingCost)
  const [paymentFeePercent, setPaymentFeePercent] = useState(fields.paymentFeePercent)
  const [paymentFeeFlat, setPaymentFeeFlat] = useState(fields.paymentFeeFlat)
  const [platformFeePercent, setPlatformFeePercent] = useState(fields.platformFeePercent)
  const [returnsReservePercent, setReturnsReservePercent] = useState(fields.returnsReservePercent)
  const [adCostPerOrder, setAdCostPerOrder] = useState(fields.adCostPerOrder)
  const [testBudget, setTestBudget] = useState(fields.testBudget)
  const [targetProfitPerOrder, setTargetProfitPerOrder] = useState(fields.targetProfitPerOrder)
  const [error, setError] = useState<string | null>(initialError)
  const [result, setResult] = useState<ProfitQuoteResult | null>(initialResult)

  useEffect(() => {
    if (!initialResult || trackedInitial.current) return
    trackedInitial.current = true
    trackUse(initialResult.economics.recommendation)
  }, [initialResult])

  function currentFields(): ProfitQuoteFields {
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

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextFields = currentFields()
    const quote = parseProfitQuote(nextFields)
    if (!isProfitQuote(quote)) {
      setError(quote.error)
      setResult(null)
      return
    }
    const outcome = runProfitQuote(quote)
    if (!isProfitResult(outcome)) {
      setError(outcome.error)
      setResult(null)
      return
    }
    setError(null)
    setResult(outcome)
    trackUse(outcome.economics.recommendation)
    router.replace(profitQuoteSearch(nextFields), { scroll: false })
  }

  const economics = result?.economics

  return (
    <div className="mt-10 flex flex-col gap-8">
      <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            Product price (USD)
            <input className={fieldClass} inputMode="decimal" required value={productPrice} onChange={event => setProductPrice(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Shipping you charge (USD)
            <input className={fieldClass} inputMode="decimal" value={shippingCharge} onChange={event => setShippingCharge(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Supplier product cost (USD)
            <input className={fieldClass} inputMode="decimal" required value={unitCost} onChange={event => setUnitCost(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Shipping you pay (USD)
            <input className={fieldClass} inputMode="decimal" value={shippingCost} onChange={event => setShippingCost(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Card fee (%)
            <input className={fieldClass} inputMode="decimal" value={paymentFeePercent} onChange={event => setPaymentFeePercent(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Card fee flat amount (USD)
            <input className={fieldClass} inputMode="decimal" value={paymentFeeFlat} onChange={event => setPaymentFeeFlat(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Platform fee (%)
            <input className={fieldClass} inputMode="decimal" value={platformFeePercent} onChange={event => setPlatformFeePercent(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Refund reserve (%)
            <input className={fieldClass} inputMode="decimal" value={returnsReservePercent} onChange={event => setReturnsReservePercent(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Ad cost per sale (USD)
            <input className={fieldClass} inputMode="decimal" value={adCostPerOrder} onChange={event => setAdCostPerOrder(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Target remainder per sale (USD)
            <input className={fieldClass} inputMode="decimal" value={targetProfitPerOrder} onChange={event => setTargetProfitPerOrder(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            Ad test budget (USD, optional)
            <input className={fieldClass} inputMode="decimal" value={testBudget} onChange={event => setTestBudget(event.target.value)} />
          </label>
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Defaults on this deployment: card fee {fees.paymentFeePercent}% plus {dollars(fees.paymentFeeFlat)}, platform fee {fees.platformFeePercent}% of the customer total. Percentage fees apply to the product price plus shipping you charge. Leave the refund reserve at 0 if you are not setting money aside. Leave ad cost blank to see the most this price can spend before it goes negative. This is the launch workspace scenario math, not a sales forecast.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <button type="submit" className="mt-4 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Calculate margin
        </button>
      </form>

      {result && economics && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-live="polite">
          <h2 className="text-2xl font-semibold">{outcomeHeading(economics.recommendation)}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Stop, review, and test are rules in this calculator. They are not a promise about what a store will earn.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Customer total</dt>
              <dd className="font-medium">{dollars(result.customerTotal)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Left before ads</dt>
              <dd className="font-medium">{dollars(economics.contributionBeforeAds)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Left after the ad cost you entered</dt>
              <dd className="font-medium">{dollars(economics.netProfitPerOrder)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Margin after ads</dt>
              <dd className="font-medium">{`${economics.netMarginPercent.toFixed(1)}%`}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Most you can spend on ads per sale</dt>
              <dd className="font-medium">{dollars(economics.breakEvenCAC)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Break-even ROAS</dt>
              <dd className="font-medium">{economics.breakEvenROAS === null ? 'Not viable' : `${economics.breakEvenROAS.toFixed(2)}×`}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ad cost that still leaves your target</dt>
              <dd className="font-medium">{dollars(economics.maxCACForTargetProfit)}</dd>
            </div>
            {result.budgetEntered && (
              <div>
                <dt className="text-muted-foreground">Orders the test budget could pay for</dt>
                <dd className="font-medium">{economics.affordableTestOrders === null ? 'Set an ad cost' : String(economics.affordableTestOrders)}</dd>
              </div>
            )}
          </dl>
          <ul className="mt-4 flex flex-col gap-2">
            {economics.reasons.map(reason => (
              <li key={reason} className="text-sm text-muted-foreground leading-relaxed">{reason}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed">
            The same math is in the{' '}
            <Link href="/launch-preview" className="text-primary hover:underline">launch workspace preview</Link>
            , which also keeps supplier notes and a campaign draft. The{' '}
            <Link href="/research/idea-checker" className="text-primary hover:underline">product idea checker</Link>
            {' '}adds the ship window and whether you have a second supplier. Neither page stores the quote.
          </p>
        </section>
      )}
    </div>
  )
}
