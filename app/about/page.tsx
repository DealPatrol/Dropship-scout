import Link from 'next/link'
import { LegalPage } from '@/components/marketing/legal-page'
import { pageMetadata } from '@/lib/seo'
import { FOUNDER_NAME, SUPPORT_EMAIL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'About',
  description: 'Why Dropship Scout exists: product research that ends in a supplier who can fulfill the order, with honest data and clear pricing.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <LegalPage
      title="About Dropship Scout"
      path="/about"
      intro={<p>Dropship Scout is a product research workspace for independent sellers. It exists to answer one question before you spend on ads: can this product sell at a profit, and can a real supplier ship it?</p>}
      sections={[
        {
          heading: 'What we believe',
          body: (
            <>
              <p>Most product research tools show screenshots of other stores and call them winners. We think research should end in a supplier quote, a price that clears fees, and a listing you can publish.</p>
              <p>So the catalog is labeled when it is sample data, the margin math is shown, and the app does not claim sales numbers it cannot verify.</p>
            </>
          ),
        },
        {
          heading: 'What you get',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>A free idea checker and research catalog, filterable by niche, season, and margin.</li>
              <li>Supplier import from CJ Dropshipping, Printful, Printify, and direct suppliers.</li>
              <li>A hosted store page, and optional Shopify publishing.</li>
              <li>Clear pricing: Free with no card, or Pro at $29/month. See <Link href="/pricing" className="text-primary hover:underline">pricing</Link>.</li>
            </ul>
          ),
        },
        {
          heading: 'Who runs it',
          body: <p>Dropship Scout is built and operated by {FOUNDER_NAME}. Questions, feedback, and support requests go to <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.</p>,
        },
      ]}
    />
  )
}
