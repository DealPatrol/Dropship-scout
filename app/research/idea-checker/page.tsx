import type { Metadata } from 'next'
import Link from 'next/link'
import { IdeaChecker } from '@/components/marketing/idea-checker'
import { JsonLd } from '@/components/marketing/json-ld'
import { SiteFrame } from '@/components/marketing/site-frame'
import { platformFeeBps, stripeFeeConfig } from '@/lib/commerce/modes'
import { ideaQueryFromSearch, isIdeaCheckResult, type IdeaCheckFees } from '@/lib/marketing/idea-check'
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

const FAQ = [
  {
    question: 'Does the product idea checker use live sales data?',
    answer: 'No. It uses the cost, price, and shipping you type, plus this deployment’s platform fee and card-fee estimate. It does not look up order counts.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No. The checker runs in the browser. Create an account when you want to save products or import a supplier. Pro removes the free limits.',
  },
  {
    question: 'Is the remainder profit?',
    answer: 'No. Ads, refunds, and a card fee different from the estimate are not included. A positive remainder only means the price clears supplier cost and the fee floor used on this page.',
  },
  {
    question: 'Can I share a result?',
    answer: 'Yes. After you check an idea, the inputs stay in the URL. The page does not store the idea unless you join the products-to-watch list or create an account.',
  },
]

export const metadata: Metadata = pageMetadata({
  title: 'Product idea checker',
  description: 'Free dropshipping product idea checker. Enter supplier cost, price, and shipping. No signup and no invented sales figures.',
  path: '/research/idea-checker',
  imagePath: '/research/idea-checker/opengraph-image',
})

export default function IdeaCheckerPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const cardFee = stripeFeeConfig()
  const fees: IdeaCheckFees = {
    platformFeeBps: platformFeeBps(),
    stripeFeeBps: cardFee.bps,
    stripeFeeFixedCents: cardFee.fixedCents,
  }
  const query = ideaQueryFromSearch(searchParams, fees)
  const initialResult = query.result && isIdeaCheckResult(query.result) ? query.result : null
  const initialError = query.result && !isIdeaCheckResult(query.result) ? query.result.error : null
  const jsonLd = jsonLdGraph([
    {
      '@type': 'WebApplication',
      name: 'Product idea checker',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: absoluteUrl('/research/idea-checker'),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'Checks a dropshipping price against supplier cost, an estimated card fee, and the platform fee. No account required.',
    },
    faqPageJsonLd(FAQ),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Research', path: '/research' },
      { name: 'Product idea checker', path: '/research/idea-checker' },
    ]),
  ])

  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-sm text-muted-foreground">
          <Link href="/research" className="hover:text-foreground">Research</Link>
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">Product idea checker</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Check your own product before you buy ads. Type the supplier quote and the price you want to charge. Nothing here is a sales forecast, and you do not need an account.
        </p>
        <IdeaChecker fields={query.fields} fees={fees} initialResult={initialResult} initialError={initialError} />
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Questions</h2>
          <div className="mt-6 flex flex-col gap-6">
            {FAQ.map(item => (
              <article key={item.question}>
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </article>
    </SiteFrame>
  )
}
