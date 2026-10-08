import Link from 'next/link'
import { ArrowRight, CheckCircle, Search, ShoppingBag, Store, Truck } from 'lucide-react'
import { JsonLd } from '@/components/marketing/json-ld'
import { SignupLink } from '@/components/marketing/signup-link'
import { SiteFrame } from '@/components/marketing/site-frame'
import { Button } from '@/components/ui/button'
import { GUIDES, HOME_FAQ } from '@/lib/marketing/content'
import { allIntentPages } from '@/lib/marketing/intent'
import { faqPageJsonLd, jsonLdGraph, organizationJsonLd, pageMetadata, softwareApplicationJsonLd } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Research before you dropship',
  description: 'Dropship Scout helps you check a product idea, then import a real supplier. Research shortlists live under Research. How-to steps live under Guides.',
  path: '/',
})

const features = [
  {
    icon: Search,
    title: 'Product research',
    description: 'Filter a labeled sample catalog by niche and season, then save the products you are actually quoting. The public preview does not require an account.',
  },
  {
    icon: Truck,
    title: 'Suppliers that can fulfill',
    description: 'Import from CJ Dropshipping, Printful, or Printify, or list a product from a direct supplier who joined the platform.',
  },
  {
    icon: Store,
    title: 'Hosted storefront',
    description: 'Product pages, a cart, and Stripe Checkout on a link this app serves. Publishing does not require another ecommerce account.',
  },
  {
    icon: ShoppingBag,
    title: 'Optional Shopify',
    description: 'Push researched listings to Shopify when you want that channel. Free accounts get a monthly cap. Pro removes it.',
  },
]

export default function LandingPage() {
  const featured = allIntentPages().slice(0, 6)
  const jsonLd = jsonLdGraph([
    organizationJsonLd(),
    softwareApplicationJsonLd(),
    faqPageJsonLd(HOME_FAQ),
  ])

  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Dropshipping product research</p>
        <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
          Research the product before you spend on ads
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
          Filter a sample catalog by season, niche, and margin. Get a supplier quote before you call anything a winner. Upgrade to Pro in Stripe Checkout when the free limits are in the way.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <SignupLink href="/auth/sign-up" location="home-hero">
            <Button size="lg" className="gap-2 px-6">Start for free <ArrowRight className="h-4 w-4" /></Button>
          </SignupLink>
          <Link href="/pricing">
            <Button variant="outline" size="lg">See pricing</Button>
          </Link>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/research/idea-checker" className="text-primary hover:underline">Check a product idea, no account</Link>
        </p>
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
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-balance">Research shortlists</h2>
          <Link href="/research" className="text-sm text-primary shrink-0">All research pages</Link>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {featured.map(page => (
            <li key={page.slug} className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold">
                <Link href={`/research/${page.slug}`} className="hover:text-primary">{page.title}</Link>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{page.description}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-balance">How-to guides</h2>
          <Link href="/guides" className="text-sm text-primary shrink-0">All guides</Link>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {GUIDES.filter(guide => guide.faqs).slice(0, 4).map(guide => (
            <li key={guide.slug} className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold">
                <Link href={`/guides/${guide.slug}`} className="hover:text-primary">{guide.title}</Link>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-10">
          <h2 className="text-2xl font-bold text-balance">A free account is enough to start the shortlist</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              '10 saved research products',
              '25 research-catalog products',
              'Sample catalog labeled as sample data',
              'Hosted store when a supplier can fulfill',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <SignupLink href="/auth/sign-up" location="home-shortlist" className="inline-block mt-6">
            <Button>Create your account</Button>
          </SignupLink>
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
