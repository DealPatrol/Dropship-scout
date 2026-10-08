import type { Metadata } from 'next'
import { absoluteUrl, FOUNDER_NAME, ORGANIZATION_EMAIL, SITE_NAME, siteUrl } from '@/lib/site'

export const TITLE_SUFFIX = ` · ${SITE_NAME}`
export const OG_IMAGE_PATH = '/opengraph-image'
export const LOGO_PATH = '/apple-icon'
/** Editorial date for article schema. Not a sales or traffic claim. */
export const CONTENT_DATE = '2026-10-08'

const MAX_TITLE_LENGTH = 60

/** Slugs that are samples rather than a seller's published shop. */
const NON_INDEXABLE_STORE_SLUG = /(?:^|-)(?:demo|test|sandbox|example)/i

export function metadataTitle(title: string): string | { absolute: string } {
  if (`${title}${TITLE_SUFFIX}`.length <= MAX_TITLE_LENGTH) return title
  if (title.length <= MAX_TITLE_LENGTH) return { absolute: title }
  return { absolute: title.slice(0, MAX_TITLE_LENGTH).trimEnd() }
}

export function documentTitle(title: string): string {
  const resolved = metadataTitle(title)
  return typeof resolved === 'string' ? `${resolved}${TITLE_SUFFIX}` : resolved.absolute
}

export function storeShouldIndex(slug: string, publishedProductCount: number): boolean {
  if (publishedProductCount <= 0) return false
  return !NON_INDEXABLE_STORE_SLUG.test(slug)
}

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl(),
    logo: absoluteUrl(LOGO_PATH),
    email: ORGANIZATION_EMAIL,
    founder: { '@type': 'Person', name: FOUNDER_NAME },
  }
}

/** Free plan only. Pro's monthly price is not published. */
export function freeOfferJsonLd() {
  return {
    '@type': 'Offer',
    name: 'Free',
    price: '0',
    priceCurrency: 'USD',
    url: absoluteUrl('/pricing'),
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: freeOfferJsonLd(),
    description:
      'Dropshipping product research with a sample catalog, supplier import, and an optional hosted storefront. Free plan included. Pro is billed in Stripe.',
    url: siteUrl(),
  }
}

export function pageMetadata(input: {
  title: string
  description: string
  path: string
  noIndex?: boolean
  type?: 'website' | 'article'
  imagePath?: string
}): Metadata {
  const socialTitle = documentTitle(input.title)
  const imagePath = input.imagePath ?? OG_IMAGE_PATH
  return {
    title: { absolute: socialTitle },
    description: input.description,
    alternates: { canonical: input.path },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: socialTitle,
      description: input.description,
      type: input.type ?? 'website',
      url: input.path,
      siteName: SITE_NAME,
      images: [{ url: imagePath, width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: input.description,
      images: [imagePath],
    },
  }
}

export function articleJsonLd(input: {
  headline: string
  description: string
  path: string
  imagePath?: string
}) {
  return {
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    image: [absoluteUrl(input.imagePath ?? OG_IMAGE_PATH)],
    datePublished: CONTENT_DATE,
    dateModified: CONTENT_DATE,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl(LOGO_PATH) },
    },
  }
}

export function jsonLdGraph(nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
