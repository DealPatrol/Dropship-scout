import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { SiteFrame } from '@/components/marketing/site-frame'
import { GUIDES, guideBySlug, guideStructuredData } from '@/lib/marketing/content'
import { intentBySlug } from '@/lib/marketing/intent'
import { researchForGuide } from '@/lib/marketing/overlap'
import { SignupCta } from '@/components/marketing/signup-cta'
import { JsonLd } from '@/components/marketing/json-ld'
import { jsonLdGraph, pageMetadata } from '@/lib/seo'

export function generateStaticParams() {
  return GUIDES.map(guide => ({ slug: guide.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = guideBySlug(params.slug)
  if (!guide) return { title: 'Guide' }
  return pageMetadata({
    title: guide.metaTitle,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: 'article',
    imagePath: `/guides/${guide.slug}/opengraph-image`,
  })
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = guideBySlug(params.slug)
  if (!guide) notFound()
  const jsonLd = jsonLdGraph(guideStructuredData(guide))
  const pairedResearch = intentBySlug(researchForGuide(guide.slug) ?? '')
  const related = (guide.relatedResearch ?? [])
    .map(slug => intentBySlug(slug))
    .filter((page): page is NonNullable<ReturnType<typeof intentBySlug>> => Boolean(page))
  return (
    <SiteFrame>
      <JsonLd data={jsonLd} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: guide.title, href: `/guides/${guide.slug}` }]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">{guide.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{guide.description}</p>
        <div className="mt-10 flex flex-col gap-8">
          {guide.sections.map((section, index) => (
            <div key={section.heading} className="flex flex-col gap-8">
              <section>
                <h2 className="text-2xl font-semibold">{section.heading}</h2>
                {section.paragraphs.map(paragraph => (
                  <p key={paragraph} className="mt-3 text-muted-foreground leading-relaxed">{paragraph}</p>
                ))}
              </section>
              {index === 0 && (
                <aside className="rounded-xl border bg-muted/40 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
                  <div>
                    <p className="font-semibold">Have a product in mind?</p>
                    <p className="mt-1 text-sm text-muted-foreground">Run it through the free idea checker. No account or card needed.</p>
                  </div>
                  <Link href="/research/idea-checker" className="mt-4 inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:mt-0">
                    Check a product idea
                  </Link>
                </aside>
              )}
            </div>
          ))}
        </div>
        {guide.faqs && guide.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Questions</h2>
            <div className="mt-6 flex flex-col gap-6">
              {guide.faqs.map(item => (
                <article key={item.question}>
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Keep going</h2>
          {pairedResearch && (
            <p className="mt-3 text-sm text-muted-foreground">
              This guide is the how-to. The research shortlist is separate:{' '}
              <Link href={`/research/${pairedResearch.slug}`} className="text-primary hover:underline">{pairedResearch.title}</Link>
            </p>
          )}
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            <li><Link href="/research/idea-checker" className="text-primary hover:underline">Check a product idea without an account</Link></li>
            <li><Link href="/pricing" className="text-primary hover:underline">Compare Free and Pro</Link></li>
            {related.map(page => (
              <li key={page.slug}>
                <Link href={`/research/${page.slug}`} className="text-primary hover:underline">{page.title}</Link>
              </li>
            ))}
          </ul>
        </section>
        <SignupCta location={`guide-${guide.slug}`} />
      </article>
    </SiteFrame>
  )
}
