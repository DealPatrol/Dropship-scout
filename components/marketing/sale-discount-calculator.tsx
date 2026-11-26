'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { FUNNEL, trackFunnel } from '@/lib/analytics/track-funnel'
import {
  calculateSaleDiscount,
  saleVerdictText,
  validateSaleInput,
  type SaleDiscountInput,
} from '@/lib/marketing/sale-discount'

const fieldClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm'

function dollars(value: number): string {
  const sign = value < 0 ? '-' : ''
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

function num(value: string, blank = 0): number {
  const trimmed = value.trim()
  if (trimmed === '') return blank
  return Number(trimmed)
}

export function SaleDiscountCalculator({
  defaults,
}: {
  defaults: { paymentFeePercent: number; paymentFeeFlat: number; platformFeePercent: number }
}) {
  const tracked = useRef(false)
  const [regularPrice, setRegularPrice] = useState('40')
  const [unitCost, setUnitCost] = useState('12')
  const [shippingCost, setShippingCost] = useState('5')
  const [paymentFeePercent, setPaymentFeePercent] = useState(String(defaults.paymentFeePercent))
  const [paymentFeeFlat, setPaymentFeeFlat] = useState(String(defaults.paymentFeeFlat))
  const [platformFeePercent, setPlatformFeePercent] = useState(String(defaults.platformFeePercent))
  const [returnsReservePercent, setReturnsReservePercent] = useState('5')
  const [adCostPerOrder, setAdCostPerOrder] = useState('8')
  const [saleAdCost, setSaleAdCost] = useState('')
  const [discountPercent, setDiscountPercent] = useState('20')

  const input: SaleDiscountInput = {
    regularPrice: num(regularPrice),
    unitCost: num(unitCost),
    shippingCost: num(shippingCost),
    paymentFeePercent: num(paymentFeePercent),
    paymentFeeFlat: num(paymentFeeFlat),
    platformFeePercent: num(platformFeePercent),
    returnsReservePercent: num(returnsReservePercent),
    adCostPerOrder: num(adCostPerOrder),
    saleAdCostPerOrder: saleAdCost.trim() === '' ? null : num(saleAdCost),
    discountPercent: num(discountPercent),
  }
  const error = validateSaleInput(input)
  const key = JSON.stringify(input)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = useMemo(() => (error ? null : calculateSaleDiscount(input)), [key, error])

  function noteUse() {
    if (tracked.current || !result) return
    tracked.current = true
    trackFunnel(FUNNEL.toolUsed, { tool: 'black-friday-discount-calculator', path: window.location.pathname, result: result.verdict })
  }

  const fields: [string, string, (v: string) => void, string?][] = [
    ['Regular price the customer pays (USD)', regularPrice, setRegularPrice, 'Include any shipping you charge.'],
    ['Supplier cost (USD)', unitCost, setUnitCost],
    ['Shipping you pay (USD)', shippingCost, setShippingCost],
    ['Card fee (%)', paymentFeePercent, setPaymentFeePercent],
    ['Card fee flat amount (USD)', paymentFeeFlat, setPaymentFeeFlat],
    ['Platform fee (%)', platformFeePercent, setPlatformFeePercent],
    ['Refund reserve (%)', returnsReservePercent, setReturnsReservePercent],
    ['Ad cost per sale, normal weeks (USD)', adCostPerOrder, setAdCostPerOrder],
    ['Ad cost per sale during the sale (USD, optional)', saleAdCost, setSaleAdCost, 'Blank means the same as normal.'],
    ['Planned discount (%)', discountPercent, setDiscountPercent],
  ]

  return (
    <div className="mt-8 flex flex-col gap-8">
      <form className="rounded-xl border border-border bg-card p-5 sm:p-6" onSubmit={event => { event.preventDefault(); noteUse() }} onChange={noteUse}>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([label, value, set, hint]) => (
            <label key={label} className="flex flex-col gap-1.5 text-sm">
              {label}
              <input className={fieldClass} inputMode="decimal" value={value} onChange={event => set(event.target.value)} />
              {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            </label>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          The example numbers are placeholders. Replace them with a dated supplier quote and your own ad cost. Defaults on this deployment: card fee {defaults.paymentFeePercent}% plus {dollars(defaults.paymentFeeFlat)}, platform fee {defaults.platformFeePercent}% (set it to 0 if your store platform charges no sales fee). The math updates as you type and nothing is saved.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </form>

      {result && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-live="polite">
          <h2 className="text-2xl font-semibold">
            {result.maxDiscountPercent === null
              ? 'No discount works at these costs'
              : `Maximum discount before a loss: ${result.maxDiscountPercent}%`}
          </h2>
          <p className="mt-3 text-sm leading-relaxed">{saleVerdictText(input, result)}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Sale price</dt><dd className="font-medium">{dollars(result.salePrice)}</dd></div>
            <div><dt className="text-muted-foreground">Profit per order at full price</dt><dd className="font-medium">{dollars(result.fullPriceProfit)}</dd></div>
            <div><dt className="text-muted-foreground">Profit per order at the sale price</dt><dd className="font-medium">{dollars(result.saleProfit)}</dd></div>
            <div><dt className="text-muted-foreground">Break-even ROAS at the sale price</dt><dd className="font-medium">{result.breakEvenRoas === null ? 'Not viable' : `${result.breakEvenRoas.toFixed(2)}×`}</dd></div>
            <div><dt className="text-muted-foreground">Orders needed vs. a normal week</dt><dd className="font-medium">{result.ordersMultiple === null ? 'Cannot match' : `${result.ordersMultiple.toFixed(2)}×`}</dd></div>
          </dl>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="text-left text-muted-foreground pb-2">Profit per order at each discount</caption>
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3 font-medium">Discount</th>
                  <th className="py-2 pr-3 font-medium">Price</th>
                  <th className="py-2 pr-3 font-medium">Profit / order</th>
                  <th className="py-2 pr-3 font-medium">Margin</th>
                  <th className="py-2 font-medium">Orders to match</th>
                </tr>
              </thead>
              <tbody>
                {result.tiers.map(row => (
                  <tr key={row.discountPercent} className={`border-b border-border ${row.discountPercent === input.discountPercent ? 'font-semibold' : ''}`}>
                    <td className="py-2 pr-3">{row.discountPercent === 0 ? 'Full price' : `${row.discountPercent}% off`}</td>
                    <td className="py-2 pr-3">{dollars(row.salePrice)}</td>
                    <td className={`py-2 pr-3 ${row.profitPerOrder <= 0 ? 'text-destructive' : ''}`}>{dollars(row.profitPerOrder)}</td>
                    <td className="py-2 pr-3">{`${row.marginPercent.toFixed(1)}%`}</td>
                    <td className="py-2">{row.ordersMultiple === null ? 'Never' : `${row.ordersMultiple.toFixed(2)}×`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm leading-relaxed">
            Check the full-price numbers in the{' '}
            <Link href="/tools/dropshipping-profit-calculator" className="text-primary hover:underline">profit calculator</Link>
            , or compare two supplier quotes in the{' '}
            <Link href="/tools/dropshipping-supplier-comparison" className="text-primary hover:underline">supplier comparison</Link>
            {' '}before the sale starts.
          </p>
        </section>
      )}
    </div>
  )
}
