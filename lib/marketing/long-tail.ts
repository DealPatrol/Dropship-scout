import type { IntentPage } from '@/lib/marketing/intent'

const SHARED = {
  question: 'Does this page include live sales numbers?',
  answer: 'No. These pages explain how to judge a product. They do not publish order counts, revenue, or ad results.',
}

export const LONG_TAIL_PAGES: IntentPage[] = [
  {
    slug: 'how-to-price-a-dropshipping-product',
    title: 'How to price a dropshipping product',
    metaTitle: 'How to price a dropshipping product',
    description: 'Price a dropshipping product from the supplier quote, shipping, card fees, and the platform fee. No invented margins.',
    kind: 'article',
    related: ['winning-dropshipping-products', 'how-to-validate-a-dropshipping-product', 'dropshipping-profit-margin'],
    sections: [
      {
        heading: 'Start from the quote, not a competitor screenshot',
        paragraphs: [
          'Write down product cost, shipping you pay, and shipping you charge. The customer price has to clear those amounts, the estimated card fee, and the platform fee before ads and refunds. A price copied from another listing skips that check.',
          'The free product idea checker does this math with the fee rates configured for this deployment. It is not a profit forecast.',
        ],
      },
      {
        heading: 'Say what the price does not include',
        paragraphs: [
          'Ads, refunds, and a reship are extra. If the remainder is thin after fees, keep the first test small or change the price, the bundle, or the supplier. Do not lower the price below the fee floor to match a crowded listing.',
        ],
      },
    ],
    faqs: [
      SHARED,
      {
        question: 'Should the price match the cheapest listing?',
        answer: 'Only if that price still clears supplier cost and fees. A cheaper page that cannot pay the supplier is not a pricing strategy.',
      },
    ],
  },
  {
    slug: 'dropshipping-profit-margin',
    title: 'Dropshipping profit margin',
    metaTitle: 'Dropshipping profit margin',
    description: 'How to read a dropshipping margin after supplier cost and fees, without a fake benchmark percentage.',
    kind: 'article',
    related: ['how-to-price-a-dropshipping-product', 'how-to-read-a-supplier-quote', 'winning-dropshipping-products'],
    sections: [
      {
        heading: 'Margin is the remainder you can explain',
        paragraphs: [
          'Subtract supplier cost, shipping you pay, the estimated card fee, and the platform fee from what the customer pays. What is left is the remainder before ads and refunds. This site does not publish a target margin, because that number depends on the quote and the ad test.',
          'A positive remainder is permission to run a small test. It is not proof the product will sell.',
        ],
      },
      {
        heading: 'What to do with a thin remainder',
        paragraphs: [
          'Change the price, drop a variant that is expensive to ship, or ask a second supplier for the same item. If none of those clear the fee floor, stop. Buying ads to “make up the margin” spends the remainder you do not have.',
        ],
      },
    ],
    faqs: [
      SHARED,
      {
        question: 'What margin is good enough?',
        answer: 'This site will not name one. Use your quote. If the remainder disappears once you reserve money for a refund, the price is not ready.',
      },
    ],
  },
  {
    slug: 'dropshipping-product-page',
    title: 'How to write a dropshipping product page',
    metaTitle: 'How to write a product page',
    description: 'What a dropshipping product page should say: buyer, variant, ship window, and a price that matches the quote.',
    kind: 'article',
    related: ['how-to-validate-a-dropshipping-product', 'dropshipping-product-photos', 'winning-dropshipping-products'],
    sections: [
      {
        heading: 'One buyer, one variant',
        paragraphs: [
          'Open with who it is for and what they can do after it arrives. Name the variant you actually ordered. If the supplier cannot ship a color, it does not belong on the page.',
          'Put the ship window in days where the buyer decides. Do not promise a faster date than the supplier gave you.',
        ],
      },
      {
        heading: 'Match the sample',
        paragraphs: [
          'Use photos of the item you received, or say clearly that the photo is the supplier image. A page that looks better than the parcel is how refunds start. The photo checklist covers the shots to take before you write the ad.',
        ],
      },
    ],
    faqs: [
      SHARED,
      {
        question: 'Can I copy a competitor product page?',
        answer: 'No. Write from your sample and your ship window. Their page may describe a different variant.',
      },
    ],
  },
  {
    slug: 'second-dropshipping-supplier',
    title: 'Why you want a second dropshipping supplier',
    metaTitle: 'A second dropshipping supplier',
    description: 'How to line up a backup dropshipping supplier for the same variant before the first ad test.',
    kind: 'article',
    related: ['how-to-read-a-supplier-quote', 'aliexpress-product-research', 'how-to-validate-a-dropshipping-product'],
    sections: [
      {
        heading: 'One supplier is a single week of failed orders',
        paragraphs: [
          'Ask a second supplier for the same variant, the same countries, and a ship window in days. You are not looking for a cheaper logo. You are looking for someone who can ship if the first one goes quiet.',
          'This app can order from CJ Dropshipping, Printful, Printify, or a direct supplier who joined the platform. A marketplace listing you cannot connect is a research note, not a backup.',
        ],
      },
      {
        heading: 'Compare quotes on one variant',
        paragraphs: [
          'Record cost, shipping, ship days, and excluded countries for both. Put each quote through the idea checker. Keep the first test small until the backup is real. “No second supplier” is an acceptable note if it is the truth.',
        ],
      },
    ],
    faqs: [
      SHARED,
      {
        question: 'Does a second supplier have to be cheaper?',
        answer: 'No. A backup that ships the same variant is useful even when the cost is higher. Write both quotes down and price from the one you will actually use first.',
      },
    ],
  },
  {
    slug: 'when-to-stop-testing-a-product',
    title: 'When to stop testing a dropshipping product',
    metaTitle: 'When to stop a product test',
    description: 'Stop a dropshipping test when the sample, the ship window, or the fee floor is wrong. Do not wait for a sales total.',
    kind: 'article',
    related: ['how-to-validate-a-dropshipping-product', 'low-competition-products-to-dropship', 'how-to-price-a-dropshipping-product'],
    sections: [
      {
        heading: 'Stop for a reason you can name',
        paragraphs: [
          'Stop when the sample does not match the page, the supplier misses the ship window they gave you, refunds cluster on quality, or the price cannot clear fees. Those are facts. A slow first day is not, by itself, one of them.',
          'This site will not tell you how many orders a test needs. It does not have that number.',
        ],
      },
      {
        heading: 'Write the stop note before you scale',
        paragraphs: [
          'Before you increase spend, reread the ship window on the page and the remainder from the idea checker. If either changed, fix the page or stop. Scaling a broken page spends the next test too.',
        ],
      },
    ],
    faqs: [
      SHARED,
      {
        question: 'Should I stop because similar listings exist?',
        answer: 'Stop only if your photo, bundle, or buyer is the same as those listings and you cannot tell them apart. Crowding is a warning, not an order count.',
      },
    ],
  },
  {
    slug: 'shopify-vs-hosted-dropshipping',
    title: 'Shopify vs a hosted dropshipping store',
    metaTitle: 'Shopify vs a hosted store',
    description: 'Compare Shopify with a hosted dropshipping store: who charges the customer, who fulfills, and when you need an account.',
    kind: 'article',
    related: ['shopify-product-research', 'what-to-sell-in-a-shopify-store', 'dropshipping-product-research-tool'],
    sections: [
      {
        heading: 'They solve different jobs',
        paragraphs: [
          'Shopify is a store you open and pay for, then connect to suppliers. A hosted store on Dropship Scout is a product page, cart, and Stripe Checkout on a link this app serves. You can research products before you open either one.',
          'If you already take orders on Shopify, you can connect it later. The customer payment stays in Shopify for those orders. The hosted store is the path that does not require a Shopify account.',
        ],
      },
      {
        heading: 'What does not change',
        paragraphs: [
          'The supplier still has to ship the variant you listed. The price still has to clear cost and fees. A research page about what to sell in a Shopify store is about the product, not about which checkout charges the card.',
        ],
      },
    ],
    faqs: [
      SHARED,
      {
        question: 'Do I need Shopify to use the idea checker?',
        answer: 'No. The checker and the sample catalog are public. Shopify is optional after you have a product a supplier can fulfill.',
      },
    ],
  },
  {
    slug: 'dropshipping-product-photos',
    title: 'Dropshipping product photo checklist',
    metaTitle: 'Dropshipping photo checklist',
    description: 'Photos to take of a dropshipping sample before you advertise: the real variant, the scale, and the ship window.',
    kind: 'article',
    related: ['tiktok-trending-products-to-sell', 'dropshipping-product-page', 'how-to-validate-a-dropshipping-product'],
    sections: [
      {
        heading: 'Photograph the item that arrived',
        paragraphs: [
          'Take the hero shot, the variant name, and one photo that shows scale. If the supplier image is all you have, do not crop it to hide a flaw you already saw on the sample.',
          'A short video can show the same item. It does not replace the ship window or the quote. Trending-video pages on this site are shortlists, not proof of sales.',
        ],
      },
      {
        heading: 'Check the photo against the listing',
        paragraphs: [
          'The color, the count in a bundle, and the size should match the variant you will order for customers. If they do not, fix the page before you spend on ads.',
        ],
      },
    ],
    faqs: [
      SHARED,
      {
        question: 'Are supplier photos enough?',
        answer: 'Enough to draft a page, not enough to scale an ad. Order a sample and compare. Use your photo when the supplier image does not match what arrived.',
      },
    ],
  },
  {
    slug: 'how-to-read-a-supplier-quote',
    title: 'How to read a supplier quote',
    metaTitle: 'How to read a supplier quote',
    description: 'Read a dropshipping supplier quote for variant, cost, shipping, ship days, and countries they will not ship to.',
    kind: 'article',
    related: ['aliexpress-product-research', 'second-dropshipping-supplier', 'how-to-price-a-dropshipping-product'],
    sections: [
      {
        heading: 'Five lines the quote must have',
        paragraphs: [
          'Variant name, product cost, shipping cost, ship window in days, and countries they will not ship to. “Fast shipping” is not a line. If a line is missing, ask before you price the page.',
          'AliExpress pages are research. A quote you can fulfill here comes from CJ Dropshipping, Printful, Printify, or a direct supplier on the platform.',
        ],
      },
      {
        heading: 'Put the quote in the checker',
        paragraphs: [
          'Enter the numbers in the product idea checker. Then ask the same questions of a second supplier. Keep the quote next to the product page so the price and the ship window stay tied to the same variant.',
        ],
      },
    ],
    faqs: [
      SHARED,
      {
        question: 'What if the quote has no ship window?',
        answer: 'Do not advertise it. Ask for days. Publish only the window the supplier confirms.',
      },
    ],
  },
]
