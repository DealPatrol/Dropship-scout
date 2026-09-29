export interface Guide {
  slug: string
  title: string
  /** Document title. With the site suffix this stays within 60 characters. */
  metaTitle: string
  description: string
  intent: string
  sections: { heading: string; paragraphs: string[] }[]
}

export const GUIDES: Guide[] = [
  {
    slug: 'dropshipping-without-shopify',
    title: 'Dropshipping without Shopify',
    metaTitle: 'Dropshipping without Shopify',
    description: 'How to sell supplier products with a hosted storefront, cart, and Stripe checkout instead of opening a Shopify store.',
    intent: 'dropshipping without Shopify',
    sections: [
      {
        heading: 'You can sell before you open a shop',
        paragraphs: [
          'A Shopify account is a common way to start dropshipping, and it is also a monthly cost, a theme, and another admin to learn before the first order. Dropship Scout sells from pages this app hosts. You sign up, connect payouts, import a product a supplier can fulfill, and publish /store/your-link.',
          'Customers see a product page, a cart, and Stripe Checkout. After payment, the app submits the order to the supplier and splits the charge. Shopify stays available as an optional sales channel if you already have a shop.',
        ],
      },
      {
        heading: 'What the hosted store includes',
        paragraphs: [
          'Each seller gets a store link, product pages, a cart, and checkout. Prices have to cover supplier cost, shipping, an estimated card fee, and the platform fee before a listing can be published. That check is what keeps a sale from paying the seller a negative amount.',
          'Tracking comes back from the supplier API, or from a direct supplier on Supplier desk, and the customer reads it on the order page. This app does not send email.',
        ],
      },
      {
        heading: 'When Shopify is still useful',
        paragraphs: [
          'If you already take orders on Shopify, connect it from Sales channels with a custom-app Admin API token. Dropship Scout validates the token, syncs published catalog products, and pulls paid unfulfilled orders into the same supplier fulfillment. The customer payment stays in Shopify, so the app records the cost split and does not create a Stripe transfer for that order.',
        ],
      },
    ],
  },
  {
    slug: 'cjdropshipping-alternative',
    title: 'A CJ Dropshipping path that does not start with Shopify',
    metaTitle: 'CJ Dropshipping without Shopify',
    description: 'What CJ Dropshipping is good for, and how a hosted storefront uses the CJ API without replacing CJ as the warehouse.',
    intent: 'CJ Dropshipping alternative',
    sections: [
      {
        heading: 'CJ is a supplier, not a storefront',
        paragraphs: [
          'CJ Dropshipping warehouses products, quotes freight, and ships orders through its API. It is not a substitute for the page a customer buys from. Apps that call themselves a CJ alternative often mean a different warehouse. Dropship Scout keeps CJ as one of the suppliers that can actually fulfill a catalog product.',
          'Import uses the public product, variant, stock, and freight endpoints. Orders use createOrderV3. Sandbox mode sends isSandbox 1 and a simulated payment so a test order does not bill the CJ wallet.',
        ],
      },
      {
        heading: 'Other suppliers on the same store',
        paragraphs: [
          'Printful and Printify are included for print-on-demand because their APIs can quote a designed product and create an unconfirmed or unproduced order in sandbox. A direct supplier can also onboard on this platform, set cost and stock, and receive orders in Supplier desk.',
          'The research catalog inside the dashboard is sample data. It cannot be published on the storefront. Every product a customer can buy has to come from one of those connected sources.',
        ],
      },
    ],
  },
  {
    slug: 'printful-vs-printify',
    title: 'Printful vs Printify for a hosted dropshipping store',
    metaTitle: 'Printful vs Printify',
    description: 'How Printful and Printify differ when you import designed products and place sandbox orders from Dropship Scout.',
    intent: 'Printful vs Printify dropshipping',
    sections: [
      {
        heading: 'Both are print-on-demand APIs',
        paragraphs: [
          'Printful and Printify print a product after a customer orders it. Neither one is a general wholesale catalog. Dropship Scout imports products that already exist in the platform Printful store or Printify shop, because a blank catalog product cannot be ordered without a design file.',
          'Printful draft orders are created with confirm false, so sandbox does not bill the Printful account. Printify orders are created without send_to_production until live mode is turned on explicitly.',
        ],
      },
      {
        heading: 'How to choose',
        paragraphs: [
          'Use the supplier that already has the designed product you want to sell. The retail price still has to clear production cost, shipping, card fees, and the platform fee. Variant cost on Printify is already in cents. Printful cost comes from the catalog variant plus a shipping-rate quote.',
          'If neither print partner fits, import a CJ product or list a product from a direct supplier who joined the platform.',
        ],
      },
    ],
  },
  {
    slug: 'supplier-payouts',
    title: 'How dropshipping payouts split a Stripe charge',
    metaTitle: 'Dropshipping payout split',
    description: 'What the seller, the supplier, and the platform each receive when a customer pays on a hosted storefront.',
    intent: 'dropshipping payout split',
    sections: [
      {
        heading: 'One charge, more than one recipient',
        paragraphs: [
          'The customer pays Dropship Scout through Stripe Checkout. The platform fee is a percentage of merchandise, 5% unless PLATFORM_FEE_BPS is changed. The seller transfer is the charge minus the Stripe fee, supplier cost, and that platform fee.',
          'CJ, Printful, and Printify bill the platform account, so their cost stays on the platform balance and only the seller is transferred. A direct supplier receives a separate Connect transfer for product cost plus shipping. Both sellers and direct suppliers onboard as Stripe Express recipient accounts.',
        ],
      },
      {
        heading: 'When the split cannot be paid',
        paragraphs: [
          'A listing is rejected when an estimated card fee would make the seller transfer negative. After payment, the webhook uses the real Stripe fee. If the supplier rejects the order, reports a higher cost, or a transfer fails, the customer is refunded and transfers that were created are reversed.',
          'Orders imported from Shopify or WooCommerce are different: the customer already paid that channel. The same split is recorded and the supplier order is placed in sandbox, but no Stripe transfer is created from a charge this app does not hold.',
        ],
      },
    ],
  },
  {
    slug: 'direct-supplier-onboarding',
    title: 'How an independent supplier joins a dropshipping platform',
    metaTitle: 'Direct supplier onboarding',
    description: 'The direct-supplier path: onboard, publish cost and stock, and receive orders without a marketplace API.',
    intent: 'direct supplier dropshipping',
    sections: [
      {
        heading: 'Not every supplier has a public API',
        paragraphs: [
          'CJ, Printful, and Printify cover warehouses and print-on-demand. A brand or small manufacturer that can ship its own goods can join as a direct supplier. They create a profile, add products with cost, shipping, and stock, and connect Stripe payouts.',
          'Sellers import those products only after the supplier payout account can receive transfers. An order decrements stock. If the order is cancelled, stock is restored once.',
        ],
      },
      {
        heading: 'How they hear about an order',
        paragraphs: [
          'The order appears in Supplier desk. An optional HTTPS notify URL receives a POST. The supplier enters a tracking number, and the customer order page shows it. There is no separate email provider in this app.',
        ],
      },
    ],
  },
]

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find(guide => guide.slug === slug)
}

export const FAQ_ITEMS = [
  {
    question: 'Do I need a Shopify account?',
    answer: 'No. Sign up, connect Stripe payouts, import a supplier product, and publish a storefront at /store/your-link. Shopify is an optional sales channel.',
  },
  {
    question: 'Which suppliers can fulfill a product?',
    answer: 'CJ Dropshipping, Printful, Printify, and a direct supplier who onboarded on this platform. The research catalog in the dashboard is sample data and cannot be sold.',
  },
  {
    question: 'Who gets paid when a customer checks out?',
    answer: 'Stripe collects the payment on the platform account. The supplier cost and a configurable platform fee are covered first. The seller receives the remainder. API suppliers are paid from the platform balance. Direct suppliers receive a Connect transfer.',
  },
  {
    question: 'Are test orders billed?',
    answer: 'Stripe stays in test mode until STRIPE_LIVE_MODE is set with a live key. Supplier orders stay in sandbox until SUPPLIER_ORDERS_MODE=live. Sandbox does not confirm Printful orders, send Printify orders to production, or pay the CJ wallet.',
  },
  {
    question: 'Can I connect Etsy, eBay, or TikTok Shop?',
    answer: 'Those directories are listed because their APIs exist, and they are marked coming soon. Connecting them needs an approved partner app, which this deployment does not start. Shopify and WooCommerce can be connected with credentials this app validates.',
  },
  {
    question: 'What does the free plan include?',
    answer: 'Free accounts can save 10 products, keep 25 research-catalog products, and publish 25 hosted listings. Pro removes those limits. Supplier API import for the storefront uses the platform keys and is available to signed-in sellers.',
  },
]

function faqByQuestion(question: string): { question: string; answer: string } {
  const item = FAQ_ITEMS.find(entry => entry.question === question)
  if (!item) throw new Error(`Missing FAQ: ${question}`)
  return item
}

/** Questions rendered in the homepage "Common questions" block. */
export const HOME_FAQ = FAQ_ITEMS.slice(0, 3)

/** Questions rendered on /pricing. Pro has no published monthly price. */
export const PRICING_FAQ = [
  faqByQuestion('What does the free plan include?'),
  {
    question: 'How is Pro billed?',
    answer: 'Pro is billed through Stripe at the price configured for the Dropship Scout Pro product.',
  },
]
