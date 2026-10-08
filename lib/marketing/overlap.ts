/** Research is the shortlist. The paired guide is the how-to. They stay on separate URLs. */
export const RESEARCH_TO_GUIDE: Record<string, string> = {
  'winning-dropshipping-products': 'how-to-find-winning-products',
  'how-to-validate-a-dropshipping-product': 'how-to-validate-a-dropshipping-product-idea',
  'dropshipping-niche-ideas': 'dropshipping-niches-for-beginners',
  'aliexpress-product-research': 'aliexpress-vs-cj-dropshipping',
  'tiktok-trending-products-to-sell': 'tiktok-made-me-buy-it-products',
  'low-competition-products-to-dropship': 'how-to-spot-saturated-products',
  'dropshipping-product-research-tool': 'dropshipping-product-research-checklist',
  'shopify-product-research': 'dropshipping-without-shopify',
}

export function guideForResearch(slug: string): string | undefined {
  return RESEARCH_TO_GUIDE[slug]
}

export function researchForGuide(slug: string): string | undefined {
  const match = Object.entries(RESEARCH_TO_GUIDE).find(([, guide]) => guide === slug)
  return match?.[0]
}
