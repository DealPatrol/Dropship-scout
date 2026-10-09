import Link from 'next/link'
import { LegalPage } from '@/components/marketing/legal-page'
import { pageMetadata } from '@/lib/seo'
import { SUPPORT_EMAIL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Contact',
  description: 'Contact Dropship Scout support about your account, billing, suppliers, or your hosted store.',
  path: '/contact',
})

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact support"
      path="/contact"
      intro={
        <p>
          Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-medium">{SUPPORT_EMAIL}</a>. A person reads every message.
        </p>
      }
      sections={[
        {
          heading: 'What to include',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>The email address on your Dropship Scout account.</li>
              <li>For billing: the date of the charge. Never send a full card number.</li>
              <li>For a store or order issue: the store link and the order number.</li>
            </ul>
          ),
        },
        {
          heading: 'Before you write',
          body: (
            <p>
              Many answers are in the <Link href="/faq" className="text-primary hover:underline">FAQ</Link> and the <Link href="/guides" className="text-primary hover:underline">guides</Link>. Plan details are on <Link href="/pricing" className="text-primary hover:underline">pricing</Link>.
            </p>
          ),
        },
      ]}
    />
  )
}
