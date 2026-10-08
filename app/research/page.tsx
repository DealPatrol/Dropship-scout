import Link from 'next/link'
import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { JsonLd } from '@/components/marketing/json-ld'
import { SignupCta } from '@/components/marketing/signup-cta'
import { WatchForm } from '@/components/marketing/watch-form'
import { SiteFrame } from '@/components/marketing/site-frame'
import { allIntentPages } from '@/lib/marketing/intent'
import { seasonForDate } from '@/lib/marketing/public-catalog'
import { breadcrumbJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { SEASON_LABELS } from '@/lib/merchandising/seasonal'

export const revalidate = 86400

export const metadata = pageMetadata({
  title: 'Dropshipping product research',
  description: 'Research shortlists for dropshipping products: seasons, niches, Shopify, and TikTok. Sample catalog only. How-to steps are under Guides.',
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
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Research', href: '/research' }]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Dropshipping product research</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          These are shortlists for choosing a product. How-to steps live under Guides, with different titles. The current season is {SEASON_LABELS[season].label.toLowerCase()}. Figures here are plan limits or sample-catalog fields, not live order counts.
        </p>
        <p className="mt-4 flex flex-col gap-2">
          <Link href="/research/idea-checker" className="text-primary hover:underline">Check a product idea, no account</Link>
          <Link href="/research/preview" className="text-primary hover:underline">Open the free sample-catalog preview</Link>
          <Link href="/guides" className="text-primary hover:underline">Read the how-to guides</Link>
          <Link href="/pricing" className="text-primary hover:underline">Compare Free and Pro</Link>
        </p>
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Seasons</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {pages.filter(page => page.kind === 'season').map(page => (
              <li key={page.slug} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-lg font-semibold">
                  <Link href={`/research/${page.slug}`} className="hover:text-primary">{page.title}</Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{page.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Topics</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {pages.filter(page => page.kind !== 'season').map(page => (
              <li key={page.slug} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-lg font-semibold">
                  <Link href={`/research/${page.slug}`} className="hover:text-primary">{page.title}</Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{page.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <div className="mt-10">
          <WatchForm source="research" />
        </div>
        <SignupCta location="research-index" />
      </div>
    </SiteFrame>
  )
}
