import { JsonLd } from '@/components/marketing/json-ld'
import { FreePlanAction, ProPlanAction } from '@/components/marketing/plan-actions'
import { SiteFrame } from '@/components/marketing/site-frame'
import { WatchForm } from '@/components/marketing/watch-form'
import { PLAN_LIMITS, PRO_MONTHLY_PRICE_LABEL, PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { PRICING_FAQ } from '@/lib/marketing/content'
import { faqPageJsonLd, freeOfferJsonLd, jsonLdGraph, pageMetadata, proOfferJsonLd } from '@/lib/seo'
import { Lock, RefreshCcw, ShieldCheck } from 'lucide-react'
import { annualPriceConfigured } from '@/lib/stripe'

export const metadata = pageMetadata({
  title: 'Pricing',
  description: 'Dropship Scout pricing: a free plan with no card required, and Pro at $29/month for unlimited research, saved products, and hosted listings. Billed securely by Stripe.',
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
    { label: 'Price', free: '$0', pro: annual ? `${PRO_MONTHLY_PRICE_LABEL}, or yearly` : PRO_MONTHLY_PRICE_LABEL },
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
      <JsonLd data={jsonLdGraph([freeOfferJsonLd(), proOfferJsonLd(), faqPageJsonLd(PRICING_FAQ)])} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Pricing</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-balance">Start free. Go Pro for ${PRO_MONTHLY_PRICE_USD} a month when you are ready to scale.</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Every account starts on Free with no card required. Pro removes the research, catalog, and listing limits for one flat monthly price. No setup fees and no contracts.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="mt-3"><span className="text-4xl font-bold">$0</span> <span className="text-muted-foreground">forever</span></p>
            <p className="mt-2 text-sm text-muted-foreground">Everything you need to build a first shortlist. No card required.</p>
            <FreePlanAction />
          </section>
          <section id="pro" className="relative rounded-xl border-2 border-primary bg-card p-6 sm:p-8 shadow-lg shadow-primary/10">
            <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">For growing stores</span>
            <h2 className="text-xl font-semibold">Pro</h2>
            <p className="mt-3"><span className="text-4xl font-bold">${PRO_MONTHLY_PRICE_USD}</span> <span className="text-muted-foreground">per month, USD</span></p>
            <p className="mt-2 text-sm text-muted-foreground">
              {annual
                ? 'Unlimited research and listings. Monthly or yearly billing, same Pro limits.'
                : 'Unlimited research, saved products, catalog builds, and hosted listings.'}
            </p>
            <ProPlanAction annualAvailable={annual} />
          </section>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
          <li className="flex items-start gap-3 rounded-lg border border-border p-4">
            <Lock className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span><span className="font-medium">Secure checkout by Stripe.</span> <span className="text-muted-foreground">Card details go to Stripe and never touch our servers.</span></span>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border p-4">
            <RefreshCcw className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span><span className="font-medium">Month to month.</span> <span className="text-muted-foreground">No contract or setup fee. Manage billing from Settings, or email support.</span></span>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border p-4">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span><span className="font-medium">Your data stays yours.</span> <span className="text-muted-foreground">Store credentials are encrypted. Read the <a href="/privacy" className="text-primary hover:underline">privacy policy</a>.</span></span>
          </li>
        </ul>
        <h2 className="mt-16 text-2xl font-bold">Compare plans</h2>
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
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
