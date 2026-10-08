import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { JsonLd } from '@/components/marketing/json-ld'
import { SignupCta } from '@/components/marketing/signup-cta'
import { SiteFrame } from '@/components/marketing/site-frame'
import { allIntentPages, intentBySlug } from '@/lib/marketing/intent'
import { guideBySlug } from '@/lib/marketing/content'
import { guideForResearch } from '@/lib/marketing/overlap'
import {
  lowCompetitionProducts,
  productsForSeason,
  publicNiches,
  seasonForDate,
  shortFormTaggedProducts,
  type PublicProduct,
} from '@/lib/marketing/public-catalog'
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, pageMetadata, softwareApplicationJsonLd } from '@/lib/seo'

export const revalidate = 86400

export function generateStaticParams() {
  return allIntentPages().map(page => ({ slug: page.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = intentBySlug(params.slug)
  if (!page) return { title: 'Research' }
  return pageMetadata({
    title: page.metaTitle,
    description: page.description,
    path: `/research/${page.slug}`,
    type: 'article',
    imagePath: `/research/${page.slug}/opengraph-image`,
  })
}

function shortlist(products: PublicProduct[]) {
  return products.slice(0, 8)
}

export default function IntentPage({ params }: { params: { slug: string } }) {
  const page = intentBySlug(params.slug)
  if (!page) notFound()

  const currentSeason = seasonForDate(new Date())
  const listed = page.kind === 'season' && page.season
    ? shortlist(productsForSeason(page.season))
    : page.kind === 'short-form'
      ? shortlist(shortFormTaggedProducts())
      : page.kind === 'low-competition'
        ? shortlist(lowCompetitionProducts())
        : []
  const niches = page.kind === 'niches' ? publicNiches() : []

  const pairedGuide = guideBySlug(guideForResearch(page.slug) ?? '')
  const graph: object[] = [
    articleJsonLd({
      headline: page.title,
      description: page.description,
      path: `/research/${page.slug}`,
      imagePath: `/research/${page.slug}/opengraph-image`,
    }),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Research', path: '/research' },
      { name: page.title, path: `/research/${page.slug}` },
    ]),
    faqPageJsonLd(page.faqs),
  ]
  if (page.slug === 'dropshipping-product-research-tool') {
    graph.push(softwareApplicationJsonLd())
  }

  return (
    <SiteFrame>
      <JsonLd data={jsonLdGraph(graph)} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Research', href: '/research' }, { name: page.title, href: `/research/${page.slug}` }]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">{page.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{page.description}</p>
        {page.season === currentSeason && (
          <p className="mt-4 text-sm text-primary">This is the current season on the calendar.</p>
        )}
        <div className="mt-10 flex flex-col gap-8">
          {page.sections.map(section => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map(paragraph => (
                <p key={paragraph} className="mt-3 text-muted-foreground leading-relaxed">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
        {listed.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Sample catalog shortlist</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Eight names from the built-in sample catalog. Audiences, windows, ship times, and competition tags are editorial sample fields. They are not measured sales.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {listed.map(product => (
                <li key={product.id} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{product.audience}</p>
                  <p className="mt-2 text-sm">Window: {product.window}. Sample ship time: {product.shippingDays} days. Competition tag: {product.competition}.</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <Link href="/research/preview" className="text-primary hover:underline">Open the free preview</Link>
              {' '}to filter the rest of the sample catalog.
            </p>
          </section>
        )}
        {niches.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Sample catalog niches</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {niches.map(niche => (
                <li key={niche.id} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-semibold">{niche.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{niche.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Questions</h2>
          <div className="mt-4 flex flex-col gap-6">
            {page.faqs.map(item => (
              <article key={item.question}>
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
        <p className="mt-8 text-sm">
          <Link href="/research/idea-checker" className="text-primary hover:underline">Check this kind of idea with your own quote</Link>
        </p>
        {pairedGuide && (
          <p className="mt-3 text-sm text-muted-foreground">
            This page is the research shortlist.{' '}
            <Link href={`/guides/${pairedGuide.slug}`} className="text-primary hover:underline">How-to guide: {pairedGuide.title}</Link>
          </p>
        )}
        {page.related.length > 0 && (
          <nav className="mt-10" aria-label="Related research">
            <h2 className="text-lg font-semibold">Keep reading</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {page.related.map(slug => {
                const related = intentBySlug(slug)
                if (!related) return null
                return (
                  <li key={slug}>
                    <Link href={`/research/${related.slug}`} className="text-primary hover:underline">{related.title}</Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
        <SignupCta location={`research-${page.slug}`} />
      </article>
    </SiteFrame>
  )
}
