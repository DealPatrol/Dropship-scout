import { JsonLd } from '@/components/marketing/json-ld'
import { FreePlanAction, ProPlanAction } from '@/components/marketing/plan-actions'
import { SiteFrame } from '@/components/marketing/site-frame'
import { PLAN_LIMITS } from '@/lib/billing'
import { PRICING_FAQ } from '@/lib/marketing/content'
import { faqPageJsonLd, freeOfferJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Pricing',
  description: 'Free and Pro plans for Dropship Scout. Pro opens Stripe Checkout after signup. The dollar amount is the Stripe Price, not a number invented on this page.',
  path: '/pricing',
})

export default function PricingPage() {
  const free = PLAN_LIMITS.free
  return (
    <SiteFrame>
      <JsonLd data={jsonLdGraph([freeOfferJsonLd(), faqPageJsonLd(PRICING_FAQ)])} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Start on Free. Pro is a Stripe subscription. This page does not publish a dollar amount, because that amount is the recurring Price on the Dropship Scout Pro product in your Stripe account.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
              <li>{free.savedProducts} saved research products</li>
              <li>{free.catalogProducts} research-catalog products</li>
              <li>{free.catalogBuildSize} products per catalog build</li>
              <li>{free.catalogProducts} hosted store listings</li>
              <li>{free.shopifyPushesPerMonth} research-catalog Shopify pushes per month</li>
              <li>Sample catalog, hosted storefront, and supplier import</li>
            </ul>
            <FreePlanAction />
          </section>
          <section id="pro" className="rounded-xl border border-primary/40 bg-card p-6">
            <h2 className="text-xl font-semibold">Pro</h2>
            <p className="mt-2 text-3xl font-bold">Monthly</p>
            <p className="mt-2 text-sm text-muted-foreground">Billed by Stripe Checkout at the configured Pro price.</p>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
              <li>Unlimited saved products, research catalogs, catalog builds, and hosted listings</li>
              <li>Unlimited research-catalog Shopify pushes</li>
              <li>Live CJ discovery adapter when that key is configured</li>
              <li>Same hosted checkout and payout split as Free</li>
            </ul>
            <ProPlanAction />
          </section>
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
