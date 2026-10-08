import Link from 'next/link'
import { SiteFrame } from '@/components/marketing/site-frame'
import { GUIDES } from '@/lib/marketing/content'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Dropshipping guides',
  description: 'Guides on dropshipping without Shopify, CJ Dropshipping, Printful, Printify, payouts, and direct suppliers.',
  path: '/guides',
})

export default function GuidesPage() {
  return (
    <SiteFrame>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Guides</h1>
        <p className="mt-4 text-muted-foreground">
          Practical pages for people comparing a hosted storefront with Shopify and supplier platforms. Product research lives under Research.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/research" className="text-primary hover:underline">Browse product research pages</Link>
        </p>
        <ul className="mt-10 flex flex-col gap-4">
          {GUIDES.map(guide => (
            <li key={guide.slug} className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">
                <Link href={`/guides/${guide.slug}`} className="hover:text-primary">{guide.title}</Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </SiteFrame>
  )
}
