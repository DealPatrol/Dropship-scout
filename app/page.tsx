import Link from 'next/link'
import { ArrowRight, CheckCircle, KeyRound, Lock, Search, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react'
import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { JsonLd } from '@/components/marketing/json-ld'
import { SignupLink } from '@/components/marketing/signup-link'
import { SiteFrame } from '@/components/marketing/site-frame'
import { Button } from '@/components/ui/button'
import { GUIDES, HOME_FAQ } from '@/lib/marketing/content'
import { allIntentPages } from '@/lib/marketing/intent'
import { faqPageJsonLd, jsonLdGraph, organizationJsonLd, pageMetadata, softwareApplicationJsonLd } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Product research that ends in a real supplier',
  description: 'Dropship Scout helps you validate a product, confirm a supplier can fulfill it, and publish a store page in one workspace. Start free, Pro is $29/month.',
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

const howItWorks = [
  {
    title: 'Validate the idea',
    description: 'Run a product through the free idea checker or filter the research catalog by niche, season, and margin. No account needed to start.',
  },
  {
    title: 'Confirm a real supplier',
    description: 'Import from CJ Dropshipping, Printful, or Printify, or a direct supplier on the platform, and check the price clears fees before you list it.',
  },
  {
    title: 'Publish when you are ready',
    description: 'Publish researched products to a hosted store page or push them to Shopify. Save every product you quote so the shortlist stays in one place.',
  },
]

const security = [
  {
    icon: Lock,
    title: 'Payments run on Stripe',
    description: 'Checkout and subscriptions are handled by Stripe. Card numbers go to Stripe directly and are never stored on Dropship Scout servers.',
  },
  {
    icon: KeyRound,
    title: 'Credentials are encrypted',
    description: 'Shopify and WooCommerce keys are encrypted before they are saved. Account passwords are stored as one-way hashes.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest data, clearly labeled',
    description: 'Sample catalog data is labeled as sample data. The app does not claim sales numbers it cannot verify.',
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
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" /> Product research, suppliers, and a storefront in one workspace
        </p>
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
          Know a product can sell and ship before you spend a dollar on ads
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
          Dropship Scout takes you from product idea to a supplier that can actually fulfill it, with the margin math done before you publish a single listing.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <SignupLink href="/auth/sign-up" location="home-hero">
            <Button size="lg" className="gap-2 px-6">Start free, no card <ArrowRight className="h-4 w-4" /></Button>
          </SignupLink>
          <Link href="/pricing">
            <Button variant="outline" size="lg">Pro is ${PRO_MONTHLY_PRICE_USD}/month</Button>
          </Link>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/research/idea-checker" className="text-primary hover:underline">Check a product idea, no account</Link>
        </p>
      </section>

      <section aria-labelledby="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 id="how-it-works" className="text-2xl sm:text-3xl font-bold text-center text-balance">How it works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden="true">{index + 1}</span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
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

      <section aria-labelledby="security" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 id="security" className="text-2xl sm:text-3xl font-bold text-center text-balance">Built to handle your store and your customers carefully</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {security.map(item => {
            const Icon = item.icon
            return (
              <article key={item.title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </article>
            )
          })}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Read the <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link> and <Link href="/terms" className="text-primary hover:underline">terms</Link>, or <Link href="/contact" className="text-primary hover:underline">contact support</Link>.
        </p>
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
