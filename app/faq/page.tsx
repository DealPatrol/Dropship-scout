import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { JsonLd } from '@/components/marketing/json-ld'
import { SignupCta } from '@/components/marketing/signup-cta'
import { SiteFrame } from '@/components/marketing/site-frame'
import { FAQ_ITEMS } from '@/lib/marketing/content'
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'FAQ',
  description: 'Answers about Dropship Scout product research, the sample catalog, suppliers, payouts, and how Pro checkout works.',
  path: '/faq',
})

export default function FaqPage() {
  const jsonLd = jsonLdGraph([
    faqPageJsonLd(FAQ_ITEMS),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ]),
  ])
  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'FAQ', href: '/faq' }]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight">FAQ</h1>
        <p className="mt-4 text-muted-foreground">Practical answers for sellers researching products and setting up a hosted store.</p>
        <div className="mt-10 flex flex-col gap-8">
          {FAQ_ITEMS.map(item => (
            <article key={item.question}>
              <h2 className="text-xl font-semibold">{item.question}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{item.answer}</p>
            </article>
          ))}
        </div>
        <SignupCta location="faq" />
      </div>
    </SiteFrame>
  )
}
