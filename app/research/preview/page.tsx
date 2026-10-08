import { JsonLd } from '@/components/marketing/json-ld'
import { SignupCta } from '@/components/marketing/signup-cta'
import { SiteFrame } from '@/components/marketing/site-frame'
import { CatalogPreview } from '@/components/marketing/catalog-preview'
import { publicCatalog, publicNiches, seasonForDate } from '@/lib/marketing/public-catalog'
import { breadcrumbJsonLd, jsonLdGraph, pageMetadata } from '@/lib/seo'
import { SEASON_LABELS } from '@/lib/merchandising/seasonal'

export const revalidate = 86400

export const metadata = pageMetadata({
  title: 'Free product research preview',
  description: 'Filter Dropship Scout’s sample catalog by niche, season, and competition tag. Sample prices are not live quotes or sales.',
  path: '/research/preview',
  imagePath: '/research/preview/opengraph-image',
})

export default function PreviewPage() {
  const season = seasonForDate(new Date())
  const products = publicCatalog()
  const niches = publicNiches()
  return (
    <SiteFrame>
      <JsonLd data={jsonLdGraph([
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Research', path: '/research' },
          { name: 'Preview', path: '/research/preview' },
        ]),
      ])} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-sm text-muted-foreground">Free preview</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Sample catalog preview</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
          This is the built-in sample catalog, starting on {SEASON_LABELS[season].label.toLowerCase()} because that is the current season. Cost, retail, margin, competition, trend, and ship time are editorial sample fields. They are not live supplier quotes, ad counts, or measured sales. Create a free account to save a shortlist. Pro checkout removes the research caps.
        </p>
        <div className="mt-8">
          <CatalogPreview products={products} niches={niches} initialSeason={season} />
        </div>
        <SignupCta location="research-preview" />
      </div>
    </SiteFrame>
  )
}
