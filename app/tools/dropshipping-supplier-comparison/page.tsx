import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { JsonLd } from '@/components/marketing/json-ld'
import { SignupCta } from '@/components/marketing/signup-cta'
import { SiteFrame } from '@/components/marketing/site-frame'
import { SupplierComparisonPanel } from '@/components/marketing/supplier-comparison-panel'
import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { guideBySlug } from '@/lib/marketing/content'
import {
  SUPPLIER_COMPARISON_DESCRIPTION,
  SUPPLIER_COMPARISON_FAQS,
  SUPPLIER_COMPARISON_PATH,
  SUPPLIER_COMPARISON_TITLE,
} from '@/lib/marketing/supplier-comparison'
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

const RELATED_GUIDES = [
  'compare-two-dropshipping-supplier-quotes',
  'supplier-processing-time-vs-transit-time',
  'cheaper-supplier-slower-shipping',
]

export const metadata: Metadata = pageMetadata({
  title: SUPPLIER_COMPARISON_TITLE,
  description: SUPPLIER_COMPARISON_DESCRIPTION,
  path: SUPPLIER_COMPARISON_PATH,
  imagePath: `${SUPPLIER_COMPARISON_PATH}/opengraph-image`,
})

export default function SupplierComparisonPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const faqs = SUPPLIER_COMPARISON_FAQS.map(item => ({ question: item.question, answer: item.answer }))
  const jsonLd = jsonLdGraph([
    {
      '@type': 'WebApplication',
      name: 'Dropshipping supplier comparison',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: absoluteUrl(SUPPLIER_COMPARISON_PATH),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'Compares two dropshipping supplier quotes on landed cost, processing days, transit days, and whether each supplier ships to one country. No account required.',
    },
    faqPageJsonLd(faqs),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Research', path: '/research' },
      { name: 'Supplier comparison', path: SUPPLIER_COMPARISON_PATH },
    ]),
  ])

  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Research', href: '/research' },
          { name: 'Supplier comparison', href: SUPPLIER_COMPARISON_PATH },
        ]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">Compare two dropshipping suppliers</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Put two quotes side by side: landed cost, processing days, transit days, and whether each supplier ships to the country you sell in. No account, and no carrier score.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/research/idea-checker" className="text-primary hover:underline">Check the quote you keep in the idea checker</Link>
          {' · '}
          <Link href="/guides/compare-two-dropshipping-supplier-quotes" className="text-primary hover:underline">How to compare two supplier quotes</Link>
        </p>
        <SupplierComparisonPanel searchParams={searchParams} />
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">How the two quotes are read</h2>
          <div className="mt-4 flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Landed cost adds the product cost and the shipping you pay. It leaves out the price you charge, card fees, refunds, and ads. Those belong in the idea checker and the profit calculator after you pick a quote.
            </p>
            <p>
              Ship days add processing and transit. Longer than 7 days should appear on the product page. Longer than 14 days should be stated before someone buys. A supplier who does not serve the country is out for that destination.
            </p>
            <p>
              When one quote is cheaper and the other is faster, both gaps stay on the page. The tool does not pick a winner for you in that case. Take the quote you keep into the idea checker and add a customer price there.
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
              <Link href="/research/idea-checker" className="text-primary hover:underline">Check a product idea</Link>
            </li>
            <li>
              <Link href="/tools/dropshipping-profit-calculator" className="text-primary hover:underline">Calculate profit margin and break-even ad cost</Link>
            </li>
            <li>
              <Link href="/pricing" className="text-primary hover:underline">Compare Free and Pro</Link>
            </li>
          </ul>
        </nav>
        <SignupCta
          location="supplier-comparison"
          heading="Save the quote when you pick a supplier"
          body={`This page does not store the comparison. A free account keeps 3 launch workspaces with supplier notes and a campaign draft. Pro is $${PRO_MONTHLY_PRICE_USD}/month, billed by Stripe, and raises that cap to 50. Checkout opens after the account exists.`}
        />
      </article>
    </SiteFrame>
  )
}
