import Link from 'next/link'
import { ArrowRight, CheckCircle, ShoppingBag, Store, Truck, Wallet } from 'lucide-react'
import { SiteFrame } from '@/components/marketing/site-frame'
import { Button } from '@/components/ui/button'
import { HOME_FAQ } from '@/lib/marketing/content'
import { faqPageJsonLd, organizationJsonLd, softwareApplicationJsonLd } from '@/lib/seo'

const features = [
  {
    icon: Store,
    title: 'Hosted storefront',
    description: 'Product pages, a cart, and Stripe Checkout on a link this app serves. Publishing does not require another ecommerce account.',
  },
  {
    icon: Truck,
    title: 'Suppliers that can fulfill',
    description: 'Import from CJ Dropshipping, Printful, or Printify, or list a product from a direct supplier who joined the platform.',
  },
  {
    icon: Wallet,
    title: 'Automatic payout split',
    description: 'After payment, the supplier order is placed and the charge is split. The seller receives what remains after supplier cost, Stripe fees, and the platform fee.',
  },
  {
    icon: ShoppingBag,
    title: 'Optional sales channels',
    description: 'Shopify and WooCommerce can sync the published catalog and pull orders. Etsy, eBay, and TikTok Shop are listed only as coming soon.',
  },
]

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd(),
      softwareApplicationJsonLd(),
      faqPageJsonLd(HOME_FAQ),
    ],
  }

  return (
    <SiteFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Hosted dropshipping storefront</p>
        <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
          Sell supplier products without opening another store
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
          Sign up, import a product a real supplier can ship, and publish a storefront with cart and checkout. Stripe collects the payment and the order is fulfilled automatically.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2 px-6">Start for free <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">See pricing</Button>
          </Link>
        </div>
      </section>

      <section id="product" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-balance">What you can do on day one</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map(feature => {
            const Icon = feature.icon
            return (
              <article key={feature.title} className="rounded-lg border border-border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-10">
          <h2 className="text-2xl font-bold text-balance">A free account is enough to publish a store</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              'Hosted product pages, cart, and checkout',
              '25 published listings on the free plan',
              'CJ, Printful, Printify, and direct suppliers',
              'Shopify and WooCommerce when you want them',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/auth/sign-up" className="inline-block mt-6">
            <Button>Create your account</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold">Common questions</h2>
        <div className="mt-6 flex flex-col gap-4">
          {HOME_FAQ.map(item => (
            <article key={item.question}>
              <h3 className="font-medium">{item.question}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </article>
          ))}
        </div>
        <Link href="/faq" className="inline-block mt-4 text-sm text-primary">Read the FAQ</Link>
      </section>
    </SiteFrame>
  )
}
