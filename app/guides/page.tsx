import Link from 'next/link'
import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { JsonLd } from '@/components/marketing/json-ld'
import { SiteFrame } from '@/components/marketing/site-frame'
import { GUIDES } from '@/lib/marketing/content'
import { breadcrumbJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Dropshipping how-to guides',
  description: 'Step-by-step dropshipping guides for quotes, suppliers, photos, and ads. Product shortlists live on the research pages.',
  path: '/guides',
})

export default function GuidesPage() {
  const howTo = GUIDES.filter(guide => guide.faqs)
  const store = GUIDES.filter(guide => !guide.faqs)
  const jsonLd = jsonLdGraph([
    {
      '@type': 'CollectionPage',
      name: 'Dropshipping how-to guides',
      url: absoluteUrl('/guides'),
      description: 'How-to guides. Research shortlists are a separate section of the site.',
    },
    {
      '@type': 'ItemList',
      itemListElement: GUIDES.map((guide, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: guide.title,
        url: absoluteUrl(`/guides/${guide.slug}`),
      })),
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Guides', path: '/guides' },
    ]),
  ])

  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Dropshipping how-to guides</h1>
        <p className="mt-4 text-muted-foreground">
          These pages are the steps: how to quote, compare suppliers, and check a page before ads. The research section is the shortlist, and it uses different titles so the two do not compete for the same query.
        </p>
        <p className="mt-4 flex flex-col gap-2 text-sm">
          <Link href="/research" className="text-primary hover:underline">Browse research shortlists</Link>
          <Link href="/research/idea-checker" className="text-primary hover:underline">Check a product idea</Link>
          <Link href="/pricing" className="text-primary hover:underline">Compare Free and Pro</Link>
        </p>
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Choose and check a product</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {howTo.map(guide => (
              <li key={guide.slug} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-lg font-semibold">
                  <Link href={`/guides/${guide.slug}`} className="hover:text-primary">{guide.title}</Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Store and suppliers</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {store.map(guide => (
              <li key={guide.slug} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-lg font-semibold">
                  <Link href={`/guides/${guide.slug}`} className="hover:text-primary">{guide.title}</Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SiteFrame>
  )
}
