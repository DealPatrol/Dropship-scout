import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { JsonLd } from '@/components/marketing/json-ld'
import { ProfitCalculatorPanel } from '@/components/marketing/profit-calculator-panel'
import { SignupCta } from '@/components/marketing/signup-cta'
import { SiteFrame } from '@/components/marketing/site-frame'
import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { guideBySlug } from '@/lib/marketing/content'
import {
  PROFIT_CALCULATOR_DESCRIPTION,
  PROFIT_CALCULATOR_FAQS,
  PROFIT_CALCULATOR_PATH,
  PROFIT_CALCULATOR_TITLE,
} from '@/lib/marketing/profit-calculator'
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

const RELATED_GUIDES = [
  'maximum-ad-cost-per-sale',
  'shipping-cost-and-dropshipping-margin',
  'when-to-scale-dropshipping-ads',
]

export const metadata: Metadata = pageMetadata({
  title: PROFIT_CALCULATOR_TITLE,
  description: PROFIT_CALCULATOR_DESCRIPTION,
  path: PROFIT_CALCULATOR_PATH,
  imagePath: `${PROFIT_CALCULATOR_PATH}/opengraph-image`,
})

export default function ProfitCalculatorPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const faqs = PROFIT_CALCULATOR_FAQS.map(item => ({ question: item.question, answer: item.answer }))
  const jsonLd = jsonLdGraph([
    {
      '@type': 'WebApplication',
      name: 'Dropshipping profit margin calculator',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: absoluteUrl(PROFIT_CALCULATOR_PATH),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'Calculates a dropshipping remainder after supplier cost, shipping, fees, a refund reserve, and ad cost per sale. No account required.',
    },
    faqPageJsonLd(faqs),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Research', path: '/research' },
      { name: 'Profit calculator', path: PROFIT_CALCULATOR_PATH },
    ]),
  ])

  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Research', href: '/research' },
          { name: 'Profit calculator', href: PROFIT_CALCULATOR_PATH },
        ]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">Dropshipping profit margin calculator</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          See what is left from a sale after supplier cost, shipping, fees, a refund reserve you choose, and ad cost per sale. No account, and no sales forecast.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/research/how-to-price-a-dropshipping-product" className="text-primary hover:underline">How to price a dropshipping product</Link>
        </p>
        <ProfitCalculatorPanel searchParams={searchParams} />
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">How the numbers are read</h2>
          <div className="mt-4 flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Customer total is the product price plus shipping you charge. Supplier cost and the shipping you pay come out next, then the card fee, the platform percent, and the refund reserve. What is left is the most that sale can spend on ads.
            </p>
            <p>
              Break-even ROAS is that customer total divided by the amount left before ads, when any amount is left. The hosted store uses a stricter publish check: the price has to clear supplier cost, an estimated card fee, and a platform fee on merchandise only. Ads and refunds are not part of that check unless you enter them here.
            </p>
            <p>
              A margin under 15% is flagged for review because that is the rule in the launch workspace. It is not a benchmark this site claims for every store.
            </p>
          </div>
        </section>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Questions</h2>
          <div className="mt-6 flex flex-col gap-6">
            {faqs.map(item => (
              <article key={item.question}>
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
        <nav className="mt-10" aria-label="Related guides">
          <h2 className="text-lg font-semibold">Read next</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {RELATED_GUIDES.map(slug => {
              const guide = guideBySlug(slug)
              if (!guide) return null
              return (
                <li key={slug}>
                  <Link href={`/guides/${guide.slug}`} className="text-primary hover:underline">{guide.title}</Link>
                </li>
              )
            })}
            <li>
              <Link href="/pricing" className="text-primary hover:underline">Compare Free and Pro</Link>
            </li>
          </ul>
        </nav>
        <SignupCta
          location="profit-calculator"
          heading="Save the quote when you want to keep it"
          body={`This page does not store the numbers. A free account keeps 3 launch workspaces with the same math, supplier notes, and a campaign draft. Pro is $${PRO_MONTHLY_PRICE_USD}/month, billed by Stripe, and raises that cap to 50. Checkout opens after the account exists.`}
        />
      </article>
    </SiteFrame>
  )
}
