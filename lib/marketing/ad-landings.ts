export interface AdLanding {
  slug: string
  title: string
  metaTitle: string
  description: string
  kicker: string
}

export const AD_LANDINGS: AdLanding[] = [
  {
    slug: 'check-your-product',
    title: 'Check your product before you spend on ads',
    metaTitle: 'Check your product idea',
    description: 'Use the free product idea checker before you buy dropshipping ads. No account. No invented sales figures.',
    kicker: 'Free product check',
  },
  {
    slug: 'worth-selling',
    title: 'Is this product worth selling?',
    metaTitle: 'Is this product worth selling?',
    description: 'Enter a supplier quote and a price. See if the offer clears fees before you call it worth selling.',
    kicker: 'Before you advertise',
  },
]

export function adLandingBySlug(slug: string): AdLanding | undefined {
  return AD_LANDINGS.find(page => page.slug === slug)
}
