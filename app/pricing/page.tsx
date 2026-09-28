import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFrame } from '@/components/marketing/site-frame'
import { Button } from '@/components/ui/button'
import { PLAN_LIMITS } from '@/lib/billing'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Free and Pro plans for Dropship Scout. The hosted storefront is included. Pro removes the free-plan listing and catalog limits.',
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  const free = PLAN_LIMITS.free
  return (
    <SiteFrame>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Start on Free. Upgrade to Pro in the dashboard when you need higher limits. Pro is billed through Stripe at the price configured for the Dropship Scout Pro product.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
              <li>{free.savedProducts} saved research products</li>
              <li>{free.catalogProducts} research-catalog products</li>
              <li>{free.catalogProducts} hosted store listings</li>
              <li>{free.shopifyPushesPerMonth} research-catalog Shopify pushes per month</li>
              <li>Hosted storefront, cart, and Stripe checkout</li>
              <li>Supplier import and optional Shopify or WooCommerce sync</li>
            </ul>
            <Link href="/auth/sign-up" className="inline-block mt-6"><Button>Create a free account</Button></Link>
          </section>
          <section className="rounded-xl border border-primary/40 bg-card p-6">
            <h2 className="text-xl font-semibold">Pro</h2>
            <p className="mt-2 text-3xl font-bold">Stripe</p>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
              <li>Unlimited saved products, research catalogs, and hosted listings</li>
              <li>Unlimited research-catalog Shopify pushes</li>
              <li>The same hosted checkout and payout split as Free</li>
              <li>Live supplier discovery adapter for CJ, when that key is configured</li>
            </ul>
            <Link href="/dashboard/settings" className="inline-block mt-6"><Button variant="outline">Upgrade from Settings</Button></Link>
          </section>
        </div>
      </div>
    </SiteFrame>
  )
}
