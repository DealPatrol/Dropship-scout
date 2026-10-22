import type { Guide } from '@/lib/marketing/content'

/** Long-tail guides for people comparing two supplier quotes before they price a product. */
export const SUPPLIER_GUIDES: Guide[] = [
  {
    slug: 'compare-two-dropshipping-supplier-quotes',
    title: 'How to compare two dropshipping supplier quotes',
    metaTitle: 'Compare two supplier quotes',
    description: 'Compare two dropshipping supplier quotes on landed cost, ship days, and whether each one delivers to your country.',
    intent: 'compare dropshipping suppliers',
    howTo: true,
    relatedResearch: [
      'aliexpress-product-research',
      'how-to-validate-a-dropshipping-product',
      'dropshipping-product-research-tool',
    ],
    sections: [
      {
        heading: 'Use the same variant and the same country',
        paragraphs: [
          'Ask each supplier for four numbers on one variant, shipped to one country: product cost, the shipping you pay, processing days before the carrier has the parcel, and transit days after that. A quote for a different color, size, or country is a different offer.',
          'Write down whether they will ship to that country. A slogan about fast shipping is not a quote, and a product photo is not a ship window.',
        ],
      },
      {
        heading: 'Add what you pay before you compare the days',
        paragraphs: [
          'Landed cost is the product cost plus the shipping you pay. Compare that total, then compare processing days plus transit days. A lower product cost with expensive freight can land higher than the other quote.',
          'The free supplier comparison on this site adds those figures from the numbers you type. It keeps a supplier who will not serve the country out of the running, even when that quote looks cheaper.',
        ],
      },
      {
        heading: 'Take the quote you keep into the idea checker',
        paragraphs: [
          'This comparison stops at cost, days, and country coverage. Open the product idea checker with the product cost, the shipping you pay, and the total ship days, then add the price you want to charge. Mark whether the other supplier can still ship, so the backup is written down.',
          'When you have a price and an ad cost, the profit calculator shows what a sale leaves. A free account can save the quote in a launch workspace. Pro raises the number of saved workspaces. Checkout opens after the account exists.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Which price do I compare first?',
        answer: 'Compare what you pay. Landed cost is product cost plus the shipping you pay. The customer price comes next, in the idea checker, after the ship window is known.',
      },
      {
        question: 'What if one supplier will not ship to the country?',
        answer: 'That quote is out for this destination. A lower product cost does not make the order deliverable. Ask for another country or another supplier.',
      },
      {
        question: 'Does the comparison rank supplier quality?',
        answer: 'No. It uses the cost, days, and country answer you enter. Order a sample of the quote you keep before you scale an ad. The public page does not store the quote.',
      },
    ],
  },
  {
    slug: 'supplier-processing-time-vs-transit-time',
    title: 'Separate processing time from transit time',
    metaTitle: 'Processing time vs transit time',
    description: 'Split a dropshipping ship quote into warehouse handling days and transit days before you publish one window.',
    intent: 'dropshipping processing time vs shipping time',
    howTo: true,
    relatedResearch: [
      'how-to-validate-a-dropshipping-product',
      'aliexpress-product-research',
      'what-to-sell-in-a-shopify-store',
    ],
    sections: [
      {
        heading: 'Ask for two clocks',
        paragraphs: [
          'Processing days are the time before the warehouse hands the parcel to a carrier. Transit days are the time after that, to the country you sell in. A single “7–15 days” line hides which half the supplier controls.',
          'Ask for both numbers on the variant you will list. If the supplier only offers a range, write down the long end. The short end is the one that creates refunds when the parcel misses it.',
        ],
      },
      {
        heading: 'Add them into the window you can publish',
        paragraphs: [
          'The product page needs one window: processing plus transit. The idea checker uses that total. Longer than 7 days belongs on the page. Longer than 14 days belongs where the buyer decides, before they pay.',
          'Those cutoffs are disclosure rules used on this site. They are not a promise that a carrier will hit the date, and they are not a score for the supplier.',
        ],
      },
      {
        heading: 'Leave a missing half blank',
        paragraphs: [
          'If you only have one of the two numbers, the quote is unfinished. Ask again, and leave the missing days blank in the supplier comparison until you have them. Filling the gap with a guess publishes a date the supplier did not give you.',
          'A sample sent to your own address checks the total against the quote. It does not replace the quote. Update the page when the sample takes longer than the window you were given.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Which number goes on the product page?',
        answer: 'The total, from the order to delivery, using the supplier’s longer estimate. Publish the window of the supplier who will fulfill the order.',
      },
      {
        question: 'What do 7 days and 14 days mean?',
        answer: 'On the idea checker and the supplier comparison, more than 7 days means put the window on the page, and more than 14 days means say so before the buy button. Neither number is a delivery guarantee.',
      },
      {
        question: 'Can I average the two suppliers?',
        answer: 'No. Each quote keeps its own total. Averaging a 6-day quote with a 20-day quote publishes a window neither supplier offered.',
      },
    ],
  },
  {
    slug: 'cheaper-supplier-slower-shipping',
    title: 'When the cheaper supplier is the slower one',
    metaTitle: 'Cheaper supplier, slower shipping',
    description: 'Weigh extra ship days on a cheaper dropshipping supplier against the dollars saved before you pick that quote.',
    intent: 'cheaper supplier longer shipping time',
    howTo: true,
    relatedResearch: [
      'how-to-validate-a-dropshipping-product',
      'aliexpress-product-research',
      'winning-dropshipping-products',
    ],
    sections: [
      {
        heading: 'Write the dollar gap and the day gap',
        paragraphs: [
          'Subtract the landed costs. Subtract the total ship days. You then have a dollar amount saved and a number of days added. Both belong on the note you decide from.',
          'The supplier comparison shows that pair when one quote is cheaper and the other is faster. It uses your numbers only. It does not tell you which gap a buyer will accept.',
        ],
      },
      {
        heading: 'The page has to match the supplier you pick',
        paragraphs: [
          'If you keep the slower quote, the product page shows that supplier’s window. The faster supplier’s date stays off the page, because that supplier is not the one shipping the order.',
          'Put the kept quote’s cost and days into the idea checker with the price you want to charge. A thin remainder before ads is a reason to keep the first test small. The checker says so when the price only barely clears fees.',
        ],
      },
      {
        heading: 'Keep the other quote when it still ships',
        paragraphs: [
          'When both suppliers serve the country, you have a backup. Record that in the idea checker as a second supplier. Keep the first ad test small until a sample from the supplier you picked matches the photo and the window on the page.',
          'When the cheaper supplier will not ship to the country, the dollar gap is irrelevant. The faster quote is the one left, even if it costs more. Price that cost in the profit calculator before you buy traffic.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is the lower landed cost the better offer?',
        answer: 'Only when you are willing to print that supplier’s ship window on the page. Extra days you will not disclose make the cheaper quote the worse offer for that page.',
      },
      {
        question: 'Should I raise the price to use the faster supplier?',
        answer: 'That is a pricing decision. Enter the faster supplier’s cost and shipping in the profit calculator and read what is left before ads. This guide does not set the price.',
      },
      {
        question: 'What if the costs and the days match?',
        answer: 'Ask which supplier has the exact variant and will send a sample. Matching numbers are not a quality check, and they are not a reason to skip the sample.',
      },
    ],
  },
]
