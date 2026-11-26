import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { JsonLd } from '@/components/marketing/json-ld'
import { SignupCta } from '@/components/marketing/signup-cta'
import { SiteFrame } from '@/components/marketing/site-frame'
import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import {
  WEEKEND_DESK_DESCRIPTION,
  WEEKEND_DESK_H1,
  WEEKEND_DESK_PATH,
  WEEKEND_DESK_TITLE,
  WEEKEND_DESK_UPDATED,
  weekendDesk,
  type WeekendPick,
} from '@/lib/weekend-desk'
import { breadcrumbJsonLd, faqPageJsonLd, howToJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

const STEPS = [
  { name: 'Read the assumptions', text: 'Every row uses the same card fee, platform fee, refund reserve, sale ad cost, and a ship cost based only on the sample supplier cost.' },
  { name: 'Keep products that still leave money', text: 'A 20% off offer is only useful when the order still leaves something after those costs. Cheap gifts often do not.' },
  { name: 'Ignore anything that loses money', text: 'If the row says the sale loses money, do not run that discount. The maximum discount is the point where the order leaves nothing.' },
  { name: 'Replace the sample price with a quote', text: 'These costs are editorial sample-catalog numbers. Get a dated supplier quote for the same variant before you publish a price or buy an ad.' },
  { name: 'Put the ship window on the page', text: 'Sample ship windows are about a week or longer. Do not promise that a Black Friday order arrives this weekend.' },
] as const

const FAQS = [
  {
    question: 'Are these live supplier quotes?',
    answer: 'No. Costs and prices come from the built-in sample catalog. They are editorial estimates, not a supplier quote, and they are not sales totals.',
  },
  {
    question: 'Why do cheap gift products disappear at 20% off?',
    answer: 'The supplier cost, the shipping you pay, the flat card fee, and the ad cost do not fall when the price falls. On a $20 product those fixed costs can consume a 20% discount.',
  },
  {
    question: 'Will a Black Friday order arrive this weekend?',
    answer: 'Not on these sample ship windows. They are measured in days, not hours. Put the real window on the product page and do not promise a faster date.',
  },
  {
    question: 'Does this predict how many orders the sale will get?',
    answer: 'No. It only shows what one order leaves under the assumptions on this page. It does not use sales data or a demand forecast.',
  },
] as const

export const metadata: Metadata = pageMetadata({
  title: WEEKEND_DESK_TITLE,
  description: WEEKEND_DESK_DESCRIPTION,
  path: WEEKEND_DESK_PATH,
})

function money(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function PickList({ items, empty }: { items: WeekendPick[]; empty: string }) {
  if (!items.length) return <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
  return (
    <div className="mt-4 flex flex-col gap-4">
      {items.map(item => (
        <article key={item.id} className="rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.audience} · {item.niches.join(', ')}</p>
          <p className="mt-3 text-sm leading-relaxed">
            Sample cost {money(item.sampleCost)} · sample price {money(item.samplePrice)} · ship assumption {money(item.shippingPaid)} ·
            at 20% off {money(item.salePrice)} leaves {money(item.saleProfit)}
            {item.maxDiscountPercent !== null ? ` · deepest discount before zero is ${item.maxDiscountPercent}%` : ''}.
          </p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.why} {item.shipNote}</p>
          <pre className="mt-3 whitespace-pre-wrap rounded-md border border-border p-3 text-sm">{item.listing}</pre>
        </article>
      ))}
    </div>
  )
}

export default function WeekendCashDeskPage() {
  const desk = weekendDesk()
  const fees = desk.assumptions
  const faqs = FAQS.map(item => ({ question: item.question, answer: item.answer }))
  const jsonLd = jsonLdGraph([
    {
      '@type': 'WebApplication',
      name: WEEKEND_DESK_H1,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: absoluteUrl(WEEKEND_DESK_PATH),
      dateModified: WEEKEND_DESK_UPDATED,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: WEEKEND_DESK_DESCRIPTION,
    },
    howToJsonLd({
      name: 'How to choose Black Friday products that still leave money',
      description: 'Five steps to keep a sale discount under the point where a sample-catalog product stops paying.',
      steps: STEPS.map(step => ({ name: step.name, text: step.text })),
    }),
    faqPageJsonLd(faqs),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Research', path: '/research' },
      { name: 'Products that still pay at 20% off', path: WEEKEND_DESK_PATH },
    ]),
  ])

  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Research', href: '/research' },
          { name: 'Products that still pay at 20% off', href: WEEKEND_DESK_PATH },
        ]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">{WEEKEND_DESK_H1}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          The short answer: discount the products that still leave money after the supplier cost, the shipping you pay, fees, a refund reserve, and the ad. Do not put 20% off on a cheap gift just because the calendar says Black Friday.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Updated {WEEKEND_DESK_UPDATED}. Sample catalog only. No account and no sales forecast.
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Assumptions on every row: card fee {fees.paymentFeePercent}% + {money(fees.paymentFeeFlat)}, platform fee {fees.platformFeePercent}%, refund reserve {fees.returnsReservePercent}%, full-price ad cost {money(fees.adCostPerOrder)}, sale ad cost {money(fees.saleAdCostPerOrder)}, planned discount {fees.discountPercent}%. Shipping you pay is $4 when the sample cost is $12 or less, $6 up to $25, and $12 above that. Products over $40 sample cost are left out because that ship assumption would be too low. The hosted storefront uses this platform fee. A store that does not charge it would leave more.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Still leaves money at {fees.discountPercent}% off</h2>
          <PickList
            items={desk.hold}
            empty="None of the seasonal sample-catalog products leave money at this discount under the assumptions above. Lower the offer, or raise the price, before you buy ads."
          />
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Do not run this discount</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            These are still seasonal or gift-tagged sample products. At {fees.discountPercent}% off they leave nothing, or they already lose money at full price. The deepest discount is the point where the order leaves zero, so set any offer well below it.
          </p>
          <PickList items={desk.stop} empty="Every seasonal sample product on this page still leaves money at the planned discount." />
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">How to use the shortlist</h2>
          <ol className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed list-decimal pl-5">
            {STEPS.map(step => (
              <li key={step.name}><span className="font-medium text-foreground">{step.name}.</span> {step.text}</li>
            ))}
          </ol>
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

        <nav className="mt-10" aria-label="Related tools">
          <h2 className="text-lg font-semibold">Read next</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li><Link href="/tools/black-friday-discount-calculator" className="text-primary hover:underline">Black Friday discount calculator</Link></li>
            <li><Link href="/tools/dropshipping-profit-calculator" className="text-primary hover:underline">Dropshipping profit calculator</Link></li>
            <li><Link href="/pricing" className="text-primary hover:underline">Compare Free and Pro</Link></li>
          </ul>
        </nav>
        <SignupCta
          location="weekend-cash-desk"
          heading="Keep the quote next to the discount"
          body={`This page saves nothing. A free account keeps 3 launch workspaces with supplier notes and a campaign draft. Pro is $${PRO_MONTHLY_PRICE_USD}/month, billed by Stripe, and keeps 50.`}
        />
      </article>
    </SiteFrame>
  )
}
