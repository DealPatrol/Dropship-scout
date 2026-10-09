import { LegalPage } from '@/components/marketing/legal-page'
import { PRO_MONTHLY_PRICE_LABEL } from '@/lib/billing'
import { pageMetadata } from '@/lib/seo'
import { SUPPORT_EMAIL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Terms of service',
  description: 'The terms for using Dropship Scout, including plans, billing, acceptable use, and your responsibilities as a seller.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      path="/terms"
      updated="October 9, 2026"
      intro={<p>These terms cover your use of Dropship Scout. By creating an account you agree to them. If you do not agree, do not use the service.</p>}
      sections={[
        {
          heading: 'Plans and billing',
          body: (
            <>
              <p>The Free plan costs nothing and has the limits shown on the pricing page. Pro is {PRO_MONTHLY_PRICE_LABEL} in US dollars, billed in advance each month by Stripe until you cancel.</p>
              <p>You can manage billing from Settings or by emailing support. Prices can change with notice before your next billing date.</p>
            </>
          ),
        },
        {
          heading: 'Research is guidance, not a guarantee',
          body: <p>Research data, margin estimates, and suggestions help you decide. They do not guarantee sales, profit, supplier performance, or ad results. Sample catalog data is labeled as sample data.</p>,
        },
        {
          heading: 'Your store and your customers',
          body: <p>You are the seller of record for products you list. You are responsible for product claims, pricing, taxes, shipping promises, refunds to your customers, and following the rules of any platform or supplier you connect.</p>,
        },
        {
          heading: 'Acceptable use',
          body: <p>Do not use Dropship Scout to sell illegal, counterfeit, or infringing products, to mislead buyers, or to interfere with the service. We may suspend accounts that do.</p>,
        },
        {
          heading: 'Availability and liability',
          body: <p>We work to keep the service running but provide it as is. To the extent the law allows, our liability for any claim is limited to what you paid us in the three months before the claim.</p>,
        },
        {
          heading: 'Contact',
          body: <p>Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.</p>,
        },
      ]}
    />
  )
}
