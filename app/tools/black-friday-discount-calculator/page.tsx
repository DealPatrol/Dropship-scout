import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { JsonLd } from '@/components/marketing/json-ld'
import { SaleDiscountCalculator } from '@/components/marketing/sale-discount-calculator'
import { SignupCta } from '@/components/marketing/signup-cta'
import { SiteFrame } from '@/components/marketing/site-frame'
import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { platformFeeBps, stripeFeeConfig } from '@/lib/commerce/modes'
import { guideBySlug } from '@/lib/marketing/content'
import {
  SALE_DISCOUNT_DESCRIPTION,
  SALE_DISCOUNT_FAQS,
  SALE_DISCOUNT_H1,
  SALE_DISCOUNT_PATH,
  SALE_DISCOUNT_STEPS,
  SALE_DISCOUNT_TITLE,
  SALE_DISCOUNT_UPDATED,
} from '@/lib/marketing/sale-discount'
import { breadcrumbJsonLd, faqPageJsonLd, howToJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

const RELATED_GUIDES = ['dropshipping-break-even-roas', 'maximum-ad-cost-per-sale', 'seasonal-dropshipping-niche-ideas']

export const metadata: Metadata = pageMetadata({
  title: SALE_DISCOUNT_TITLE,
  description: SALE_DISCOUNT_DESCRIPTION,
  path: SALE_DISCOUNT_PATH,
})

export default function SaleDiscountPage() {
  const card = stripeFeeConfig()
  const defaults = {
    paymentFeePercent: card.bps / 100,
    paymentFeeFlat: card.fixedCents / 100,
    platformFeePercent: platformFeeBps() / 100,
  }
  const faqs = SALE_DISCOUNT_FAQS.map(item => ({ question: item.question, answer: item.answer }))
  const jsonLd = jsonLdGraph([
    {
      '@type': 'WebApplication',
      name: 'Black Friday discount calculator for dropshipping',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: absoluteUrl(SALE_DISCOUNT_PATH),
      dateModified: SALE_DISCOUNT_UPDATED,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'Shows the deepest discount a dropshipped product can take before an order loses money, profit per order at 10% to 50% off, break-even ROAS at the sale price, and how many more orders the sale needs. No account required.',
    },
    howToJsonLd({
      name: 'How to choose a Black Friday discount for a dropshipped product',
      description: 'Five steps to find the deepest discount a product can take and pick an offer below it.',
      steps: SALE_DISCOUNT_STEPS.map(step => ({ name: step.name, text: step.text })),
    }),
    faqPageJsonLd(faqs),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Research', path: '/research' },
      { name: 'Black Friday discount calculator', path: SALE_DISCOUNT_PATH },
    ]),
  ])

  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Research', href: '/research' },
          { name: 'Black Friday discount calculator', href: SALE_DISCOUNT_PATH },
        ]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">{SALE_DISCOUNT_H1}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          The short answer: the deepest discount you can give is 1 − (supplier cost + shipping you pay + flat card fee + ad cost per sale) ÷ (regular price × (1 − percent fees − refund reserve)). Set your Black Friday and Cyber Monday offer well below that line, because the supplier cost and the ad cost do not get cheaper when your price does.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">Updated November 26, 2026. No account, no sales forecast.</p>
        <SaleDiscountCalculator defaults={defaults} />

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">How to pick the offer</h2>
          <ol className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed list-decimal pl-5">
            {SALE_DISCOUNT_STEPS.map(step => (
              <li key={step.name}><span className="font-medium text-foreground">{step.name}.</span> {step.text}</li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">A worked example</h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            A $40 product with a $12 supplier cost, $5 shipping, a 2.9% + $0.30 card fee, no platform fee, a 5% refund reserve, and an $8 ad cost per sale leaves about $11.54 per order at full price. At 20% off the customer pays $32 and the order leaves about $4.17, so the sale needs roughly 2.8 times the normal number of orders to earn the same total. The order stops paying anything at about 31% off. Those are example inputs, not a benchmark.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Offers that protect the margin</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>Discount the products with the widest gap below their maximum discount, not the whole catalog.</li>
            <li>A bundle or a second-item offer spreads one ad cost over two items, which a straight percent off cannot do.</li>
            <li>Confirm the supplier can ship before your holiday cutoff. A late order during the sale costs a refund and the ad you paid for it.</li>
            <li>Raise ad cost per sale for sale week if your own past results show it climbs. Do not assume it falls.</li>
          </ul>
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
                <li key={slug}><Link href={`/guides/${guide.slug}`} className="text-primary hover:underline">{guide.title}</Link></li>
              )
            })}
            <li><Link href="/tools/weekend-cash-desk" className="text-primary hover:underline">Products that still pay at 20% off</Link></li>
            <li><Link href="/tools/dropshipping-profit-calculator" className="text-primary hover:underline">Dropshipping profit calculator</Link></li>
            <li><Link href="/pricing" className="text-primary hover:underline">Compare Free and Pro</Link></li>
          </ul>
        </nav>
        <SignupCta
          location="black-friday-discount-calculator"
          heading="Keep sale-week numbers for every product"
          body={`This page saves nothing. A free account keeps 3 launch workspaces with the same costs, supplier notes, and a campaign draft, so you can compare products before you pick which ones to discount. Pro is $${PRO_MONTHLY_PRICE_USD}/month, billed by Stripe, and keeps 50.`}
        />
      </article>
    </SiteFrame>
  )
}
