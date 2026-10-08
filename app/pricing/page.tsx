import { JsonLd } from '@/components/marketing/json-ld'
import { FreePlanAction, ProPlanAction } from '@/components/marketing/plan-actions'
import { SiteFrame } from '@/components/marketing/site-frame'
import { WatchForm } from '@/components/marketing/watch-form'
import { PLAN_LIMITS } from '@/lib/billing'
import { PRICING_FAQ } from '@/lib/marketing/content'
import { faqPageJsonLd, freeOfferJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { annualPriceConfigured } from '@/lib/stripe'

export const metadata = pageMetadata({
  title: 'Pricing',
  description: 'Free and Pro plans for Dropship Scout. Compare limits, then open Stripe Checkout. The dollar amount is the Stripe Price.',
  path: '/pricing',
})

function limitLabel(value: number | null): string {
  return value === null ? 'Unlimited' : String(value)
}

export default function PricingPage() {
  const free = PLAN_LIMITS.free
  const pro = PLAN_LIMITS.pro
  const annual = annualPriceConfigured()
  const rows: { label: string; free: string; pro: string }[] = [
    { label: 'Price', free: '$0', pro: annual ? 'Monthly or annual Stripe Price' : 'Monthly Stripe Price' },
    { label: 'Saved research products', free: limitLabel(free.savedProducts), pro: limitLabel(pro.savedProducts) },
    { label: 'Research-catalog products', free: limitLabel(free.catalogProducts), pro: limitLabel(pro.catalogProducts) },
    { label: 'Products per catalog build', free: limitLabel(free.catalogBuildSize), pro: limitLabel(pro.catalogBuildSize) },
    { label: 'Hosted store listings', free: limitLabel(free.catalogProducts), pro: limitLabel(pro.catalogProducts) },
    { label: 'Research-catalog Shopify pushes per month', free: limitLabel(free.shopifyPushesPerMonth), pro: limitLabel(pro.shopifyPushesPerMonth) },
    {
      label: 'Live CJ discovery',
      free: 'Not included',
      pro: 'Included when the CJ key is configured',
    },
    { label: 'Sample catalog and hosted store', free: 'Included', pro: 'Included' },
    { label: 'Supplier import for the storefront', free: 'Included', pro: 'Included' },
  ]

  return (
    <SiteFrame>
      <JsonLd data={jsonLdGraph([freeOfferJsonLd(), faqPageJsonLd(PRICING_FAQ)])} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Free and Pro use the same hosted checkout. Pro removes the limits below. The charge is the Stripe Price on your account, so this page does not publish a dollar amount for Pro.
        </p>
        <div className="mt-10 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">Free and Pro comparison</caption>
            <thead className="bg-card text-left">
              <tr>
                <th scope="col" className="p-4 font-semibold"> </th>
                <th scope="col" className="p-4 font-semibold">Free</th>
                <th scope="col" className="p-4 font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label} className="border-t border-border">
                  <th scope="row" className="p-4 text-left font-medium">{row.label}</th>
                  <td className="p-4 text-muted-foreground">{row.free}</td>
                  <td className="p-4 text-muted-foreground">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <p className="mt-2 text-sm text-muted-foreground">The limits in the table. No card required.</p>
            <FreePlanAction />
          </section>
          <section id="pro" className="rounded-xl border border-primary/40 bg-card p-6">
            <h2 className="text-xl font-semibold">Pro</h2>
            <p className="mt-2 text-3xl font-bold">{annual ? 'Monthly or annual' : 'Monthly'}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {annual
                ? 'Both intervals unlock the same Pro limits. Each button opens the matching Stripe Price.'
                : 'Billed by Stripe Checkout at the configured monthly Pro price. Annual billing appears here when that Price is configured.'}
            </p>
            <ProPlanAction annualAvailable={annual} />
          </section>
        </div>
        <div className="mt-10 max-w-xl">
          <WatchForm source="pricing" />
        </div>
        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold">Pricing questions</h2>
          <div className="mt-6 flex flex-col gap-6">
            {PRICING_FAQ.map(item => (
              <article key={item.question}>
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </SiteFrame>
  )
}
