import type { Metadata } from 'next'
import { SiteFrame } from '@/components/marketing/site-frame'
import { FAQ_ITEMS } from '@/lib/marketing/content'
import { faqPageJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers about selling on Dropship Scout without Shopify, which suppliers can fulfill orders, and how payouts are split.',
  alternates: { canonical: '/faq' },
}

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    ...faqPageJsonLd(FAQ_ITEMS),
  }
  return (
    <SiteFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">FAQ</h1>
        <p className="mt-4 text-muted-foreground">Practical answers for sellers setting up a hosted store.</p>
        <div className="mt-10 flex flex-col gap-8">
          {FAQ_ITEMS.map(item => (
            <article key={item.question}>
              <h2 className="text-xl font-semibold">{item.question}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </SiteFrame>
  )
}
