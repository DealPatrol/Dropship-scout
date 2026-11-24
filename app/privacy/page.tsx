import { LegalPage } from '@/components/marketing/legal-page'
import { pageMetadata } from '@/lib/seo'
import { SUPPORT_EMAIL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Privacy policy',
  description: 'What Dropship Scout collects, why, who processes it, and how to ask for a copy or deletion of your data.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      path="/privacy"
      updated="November 23, 2026"
      intro={<p>This page explains what Dropship Scout collects, why, and who helps us process it. We do not sell personal information.</p>}
      sections={[
        {
          heading: 'What we collect',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>Account details: your email address and a one-way hash of your password.</li>
              <li>What you save in the app: researched products, store listings, and settings.</li>
              <li>Store connections: Shopify or WooCommerce credentials you add, encrypted before they are stored.</li>
              <li>Billing references from Stripe, such as customer and subscription IDs. We do not receive or store full card numbers.</li>
              <li>Email addresses you submit to a watch list or waitlist.</li>
              <li>Campaign details when you arrive from an ad or link, such as utm parameters and click IDs, saved with your account at signup.</li>
              <li>App Store subscription references when you subscribe in the iOS app: the App Store original transaction ID, product, and renewal date. Apple processes the payment; we never receive your Apple ID or card details.</li>
            </ul>
          ),
        },
        {
          heading: 'Dropship Scout for iPhone',
          body: (
            <>
              <p>The iOS app&apos;s Scout Kit (watchlist, supplier notes, profit calculator, reminders and app lock settings) is stored only on your iPhone. It is not sent to us unless you export or share it yourself. Face ID or passcode checks are performed by iOS and the app never receives biometric data.</p>
              <p>When you open the online workspace in the app, it uses the same account data described on this page. The iOS app does not load advertising pixels and does not track you across other companies&apos; apps or websites.</p>
            </>
          ),
        },
        {
          heading: 'Cookies',
          body: <p>We use a session cookie to keep you signed in and a first-party cookie to remember which campaign brought you here. If advertising or analytics tags (Meta, Google) are enabled on the site, those providers may set their own cookies.</p>,
        },
        {
          heading: 'Who processes data for us',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>Stripe, for web checkout, web subscriptions, and payouts.</li>
              <li>Apple, for subscriptions bought in the iOS app.</li>
              <li>Vercel, for hosting, and Neon, for the database.</li>
              <li>Anthropic, which receives product research prompts to generate suggestions. Prompts do not include your password or store credentials.</li>
              <li>Suppliers you choose (such as CJ Dropshipping, Printful, or Printify), which receive the order and shipping details needed to fulfill an order.</li>
            </ul>
          ),
        },
        {
          heading: 'Your choices',
          body: (
            <>
              <p>You can permanently delete your account at any time in Settings › Delete account, on the web or in the iOS app. Deletion removes your account, saved research, launches, hosted store, listings, orders and connected channel credentials, and cancels a web Pro subscription. App Store subscriptions are managed by Apple; cancel them in your Apple ID settings.</p>
              <p>Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a> from your account address to get a copy of your data or correct it.</p>
            </>
          ),
        },
        {
          heading: 'Changes',
          body: <p>If this policy changes, the date at the top of this page changes with it.</p>,
        },
      ]}
    />
  )
}
