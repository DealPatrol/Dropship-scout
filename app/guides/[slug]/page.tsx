import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteFrame } from '@/components/marketing/site-frame'
import { GUIDES, guideBySlug } from '@/lib/marketing/content'
import { breadcrumbJsonLd, documentTitle, metadataTitle, OG_IMAGE_PATH } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

export function generateStaticParams() {
  return GUIDES.map(guide => ({ slug: guide.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = guideBySlug(params.slug)
  if (!guide) return { title: 'Guide' }
  const title = documentTitle(guide.metaTitle)
  return {
    title: metadataTitle(guide.metaTitle),
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title,
      description: guide.description,
      type: 'article',
      url: `/guides/${guide.slug}`,
      images: [OG_IMAGE_PATH],
    },
  }
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = guideBySlug(params.slug)
  if (!guide) notFound()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        mainEntityOfPage: absoluteUrl(`/guides/${guide.slug}`),
        author: { '@type': 'Organization', name: 'Dropship Scout' },
      },
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Guides', path: '/guides' },
        { name: guide.title, path: `/guides/${guide.slug}` },
      ]),
    ],
  }
  return (
    <SiteFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-sm text-muted-foreground"><Link href="/guides" className="hover:text-foreground">Guides</Link></p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">{guide.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{guide.description}</p>
        <div className="mt-10 flex flex-col gap-8">
          {guide.sections.map(section => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map(paragraph => (
                <p key={paragraph} className="mt-3 text-muted-foreground leading-relaxed">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </SiteFrame>
  )
}
