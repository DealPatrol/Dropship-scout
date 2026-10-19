import type { Guide } from '@/lib/marketing/content'

/** Long-tail guides for people pricing a first test or deciding whether to scale ads. */
export const MARGIN_GUIDES: Guide[] = [
  {
    slug: 'maximum-ad-cost-per-sale',
    title: 'How to find your maximum ad cost per sale',
    metaTitle: 'Maximum ad cost per sale',
    description: 'Find the most you can spend on ads for one dropshipping sale after supplier cost, shipping, and fees.',
    intent: 'dropshipping cost per purchase',
    howTo: true,
    relatedResearch: [
      'dropshipping-profit-margin',
      'how-to-price-a-dropshipping-product',
      'how-to-validate-a-dropshipping-product',
    ],
    sections: [
      {
        heading: 'Start from what the customer pays',
        paragraphs: [
          'Add the product price and any shipping you charge. That customer total is the money you have to work with. Subtract the supplier’s product cost and the shipping you pay the carrier or the warehouse.',
          'Then subtract the card fee and any platform fee you actually pay. What remains is the contribution before ads. That amount is the most the sale can spend on advertising without going negative.',
        ],
      },
      {
        heading: 'Treat break-even as a ceiling, not a target',
        paragraphs: [
          'Break-even ROAS is the customer total divided by the contribution, when the contribution is still positive. An ad that returns less than that multiple does not cover the costs you entered.',
          'A target you want to keep, and a refund reserve you choose to set aside, both shrink the cost per sale you can afford. The profit calculator on this site asks for those amounts. It does not invent a reserve or a “good” ROAS.',
        ],
      },
      {
        heading: 'Write the number down before the first ad',
        paragraphs: [
          'Put your quote into the free profit calculator linked on this page. Leave ad cost blank to see the ceiling. Enter a cost per sale only when you have one from a test, or when you want to see what that cost would leave.',
          'Save the quote in a launch workspace when you want the number next to the supplier note and the campaign draft. A free account keeps 3 workspaces. Pro raises that cap. The calculator itself stays free and does not start checkout.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What if the contribution is zero or negative?',
        answer: 'There is no ad budget that makes the order profitable. Change the price, the supplier cost, or the shipping before you buy traffic.',
      },
      {
        question: 'Should I use my target cost per sale or the break-even cost?',
        answer: 'Know both. Break-even is the point where the sale stops covering the costs you entered. A target remainder is what you want left after ads. Spend above break-even and the order loses money on these inputs.',
      },
      {
        question: 'Does Dropship Scout store the quote?',
        answer: 'The public calculator does not. A launch workspace does, after you create an account. Pro does not change the math. It raises the number of workspaces you can save.',
      },
    ],
  },
  {
    slug: 'shipping-cost-and-dropshipping-margin',
    title: 'How shipping costs change a dropshipping margin',
    metaTitle: 'Shipping and your margin',
    description: 'Put shipping you pay and shipping you charge into a dropshipping margin before you set a price or buy ads.',
    intent: 'dropshipping shipping cost margin',
    howTo: true,
    relatedResearch: [
      'how-to-price-a-dropshipping-product',
      'how-to-read-a-supplier-quote',
      'dropshipping-profit-margin',
    ],
    sections: [
      {
        heading: 'Write down two shipping numbers',
        paragraphs: [
          'One number is what you pay to move the item to the customer. The other is what you charge them, if you charge shipping at all. A quote that only lists product cost is not ready to price.',
          'Ask the supplier for the ship window and the countries they will not ship to at the same time. A cheap product cost with expensive freight to your country is a different offer from the product cost alone.',
        ],
      },
      {
        heading: 'Decide where the freight shows up',
        paragraphs: [
          'You can fold freight into the product price, or show it as a shipping line. Either way, the customer total has to cover product cost, the freight you pay, and fees. Hiding freight in a low product price does not remove it.',
          'On this calculator, percentage fees apply to that customer total. On the hosted store, the platform fee is a share of merchandise only, and a listing is rejected when the price cannot clear supplier cost, the estimated card fee, and that platform fee. Ads and refunds are still extra there.',
        ],
      },
      {
        heading: 'Recalculate before you advertise',
        paragraphs: [
          'Run the two shipping numbers through the profit calculator, then through the product idea checker if you also want the sample and second-supplier notes. If the remainder disappears once freight is included, do not buy ads to “make the margin back.”',
          'When the numbers clear, keep the quote with the variant you priced. A second supplier should be asked for the same variant and the same destination, because freight is part of the comparison.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Should I offer free shipping?',
        answer: 'Only if the product price still covers the freight you pay, plus fees. “Free shipping” moves the freight into the price. It does not delete it.',
      },
      {
        question: 'Which shipping cost belongs in the margin?',
        answer: 'The freight you pay. Shipping you charge is part of what the customer pays. Using only one of those numbers overstates the remainder.',
      },
      {
        question: 'Where do I enter this on Dropship Scout?',
        answer: 'Use the profit calculator for price, both shipping amounts, fees, and ad cost per sale. Use the idea checker when you also want a note on the ship window, similar listings, and whether you have a second supplier.',
      },
    ],
  },
  {
    slug: 'when-to-scale-dropshipping-ads',
    title: 'When to scale dropshipping ads',
    metaTitle: 'When to scale dropshipping ads',
    description: 'Scale dropshipping ads only after the sample, ship window, and cost per sale still leave a remainder.',
    intent: 'when to scale dropshipping ads',
    howTo: true,
    relatedResearch: [
      'when-to-stop-testing-a-product',
      'how-to-validate-a-dropshipping-product',
      'dropshipping-profit-margin',
    ],
    sections: [
      {
        heading: 'Confirm the offer still matches the sample',
        paragraphs: [
          'A first sale is not a reason to raise the budget. Reread the page against the item that arrived: variant, photo, and the ship window the supplier actually met. If those slipped, fix them or stop before you spend more.',
          'This site does not know how many orders a test needs. It will not tell you that a product is ready because of a view count or a revenue screenshot.',
        ],
      },
      {
        heading: 'Compare the cost per sale with the contribution',
        paragraphs: [
          'Take the ad cost per sale from the test you already ran. Enter it next to the current supplier quote, shipping, and fees. If that cost uses up the contribution, scaling spends more on a sale that does not pay for itself.',
          'If you have not run ads yet, the break-even cost is only a ceiling. It is not evidence that you can buy traffic at that price. Keep the first test inside a budget you can afford to lose.',
        ],
      },
      {
        heading: 'Scale only while the facts stay true',
        paragraphs: [
          'Increase spend when the sample still matches, the ship window on the page is still the one the supplier confirmed, and the cost per sale still leaves the remainder you required. Change any one of those and go back to a small test.',
          'A free account can save 3 launch workspaces so the quote, the draft, and the result sit together. Pro is the paid plan that raises the saved-workspace cap to 50 and removes the free research limits. It does not pick a winning product, and checkout does not open until you have an account.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Should I scale because a similar product looks popular?',
        answer: 'No. Popularity is not your cost per sale. Scale from your quote, your sample, and the ad cost you measured.',
      },
      {
        question: 'What should make me stop instead?',
        answer: 'Stop when the sample does not match the page, the supplier misses the ship window, refunds cluster on quality, or the price no longer clears fees and the ad cost. A slow first day, by itself, is not that list.',
      },
      {
        question: 'Can the profit calculator tell me to scale?',
        answer: 'It can show that the amounts you typed still leave a remainder, or that they do not. Demand, creative, and the supplier’s next shipment are outside the form.',
      },
    ],
  },
]
