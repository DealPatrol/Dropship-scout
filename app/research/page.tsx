import Link from 'next/link'
import { JsonLd } from '@/components/marketing/json-ld'
import { SignupCta } from '@/components/marketing/signup-cta'
import { SiteFrame } from '@/components/marketing/site-frame'
import { allIntentPages } from '@/lib/marketing/intent'
import { seasonForDate } from '@/lib/marketing/public-catalog'
import { breadcrumbJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { SEASON_LABELS } from '@/lib/merchandising/seasonal'

export const revalidate = 86400

export const metadata = pageMetadata({
  title: 'Dropshipping product research',
  description: 'Buyer-intent guides for choosing dropshipping products, plus a free sample-catalog preview. No invented sales figures.',
  path: '/research',
  imagePath: '/research/opengraph-image',
})

export default function ResearchIndexPage() {
  const season = seasonForDate(new Date())
  const pages = allIntentPages()
  const jsonLd = jsonLdGraph([
    {
      '@type': 'CollectionPage',
      name: 'Dropshipping product research',
      url: absoluteUrl('/research'),
    },
    {
      '@type': 'ItemList',
      itemListElement: pages.map((page, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: page.title,
        url: absoluteUrl(`/research/${page.slug}`),
      })),
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Research', path: '/research' },
    ]),
  ])

  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Dropshipping product research</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          These pages explain how to choose a product before you buy ads. The current season is {SEASON_LABELS[season].label.toLowerCase()}. Figures on this site are either plan limits or sample-catalog fields. They are not live order counts.
        </p>
        <p className="mt-4">
          <Link href="/research/preview" className="text-primary hover:underline">Open the free sample-catalog preview</Link>
        </p>
        <ul className="mt-10 flex flex-col gap-4">
          {pages.map(page => (
            <li key={page.slug} className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">
                <Link href={`/research/${page.slug}`} className="hover:text-primary">{page.title}</Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{page.description}</p>
            </li>
          ))}
        </ul>
        <SignupCta location="research-index" />
      </div>
    </SiteFrame>
  )
}
