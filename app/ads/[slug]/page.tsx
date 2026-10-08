import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IdeaCheckerPanel } from '@/components/marketing/idea-checker-panel'
import { SiteFrame } from '@/components/marketing/site-frame'
import { adLandingBySlug } from '@/lib/marketing/ad-landings'
import { pageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = adLandingBySlug(params.slug)
  if (!page) return { title: 'Offer' }
  return pageMetadata({
    title: page.metaTitle,
    description: page.description,
    path: `/ads/${page.slug}`,
    noIndex: true,
  })
}

export default function AdLandingPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const page = adLandingBySlug(params.slug)
  if (!page) notFound()
  return (
    <SiteFrame>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{page.kicker}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">{page.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{page.description}</p>
        <IdeaCheckerPanel searchParams={searchParams} shareBase={`/ads/${page.slug}`} />
        <p className="mt-8 text-sm text-muted-foreground">
          The indexed version of this tool is the{' '}
          <Link href="/research/idea-checker" className="text-primary hover:underline">product idea checker</Link>.
          {' '}Pro limits are on <Link href="/pricing" className="text-primary hover:underline">pricing</Link>.
        </p>
      </article>
    </SiteFrame>
  )
}
