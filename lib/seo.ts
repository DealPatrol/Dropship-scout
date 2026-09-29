import { absoluteUrl, FOUNDER_NAME, ORGANIZATION_EMAIL, SITE_NAME, siteUrl } from '@/lib/site'

export const TITLE_SUFFIX = ` · ${SITE_NAME}`
export const OG_IMAGE_PATH = '/opengraph-image'
export const LOGO_PATH = '/apple-icon'

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
    description: 'Hosted dropshipping storefront with supplier fulfillment and Stripe Connect payouts.',
    url: siteUrl(),
  }
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
