import type { Guide } from '@/lib/marketing/content'

const PRO_PRICE = '$29 a month'

/** Buyer-intent guides for product research: search method, validation, seasons, and tool comparisons. */
export const PRODUCT_RESEARCH_GUIDES: Guide[] = [
  {
    slug: 'how-to-find-winning-dropshipping-products',
    title: 'How to find winning dropshipping products',
    metaTitle: 'How to find winning dropshipping products',
    description: 'How to find winning dropshipping products: name a buyer, collect candidates, and score a quote before ads. No invented order counts.',
    intent: 'how to find winning dropshipping products',
    howTo: true,
    relatedResearch: [
      'winning-dropshipping-products',
      'how-to-validate-a-dropshipping-product',
      'dropshipping-product-research-tool',
    ],
    relatedGuides: [
      'dropshipping-product-validation-checklist',
      'compare-dropshipping-product-research-tools',
      'seasonal-dropshipping-niche-ideas',
    ],
    sections: [
      {
        heading: 'Write the buyer before you open a tool',
        paragraphs: [
          'A product is worth a test when you can name who pays, what job the item does, and why they would pay this month. On this site, winning means that sentence plus a supplier quote that clears fees. It does not mean a published order count.',
          'Start with one buyer. A commuter who spills coffee in a car is a buyer. "Home gadgets" is a pile of names. If the sentence only works when you paste in a trend report, you do not have a product yet.',
        ],
      },
      {
        heading: 'Pull names from places you can open',
        paragraphs: [
          'Use three sources, and label which one each name came from. The sample catalog on this site, filtered by season or niche, is editorial. A supplier you can order from (CJ Dropshipping, a designed Printful or Printify product, or a direct supplier on the platform) is a fulfillment source. An ad you can watch, or a hand-picked list on another research product, is only a creative source.',
          'Do not mix the labels. A name on a hand-picked list is a prompt. A product in an ad is a prompt. Neither one is a supplier quote, and this site will not turn either one into a sales total.',
        ],
      },
      {
        heading: 'Score five facts you can actually check',
        paragraphs: [
          'For each name, write supplier cost, the shipping you pay, ship days, whether a second supplier can ship the same variant, and whether similar listings already fill the first screen of search. Leave a blank when you do not know. A blank is a reason to ask, not a reason to guess.',
          'Run the numbers you do have through the product idea checker. If the price does not clear supplier cost, the estimated card fee, and the platform fee, stop. Use the profit calculator when you also have an ad cost per sale. Use the supplier comparison when you have two quotes for the same variant and the same country.',
        ],
      },
      {
        heading: 'Keep three names, then sample one',
        paragraphs: [
          'Keep at most three names that still have a buyer sentence and a price the idea checker marks as clearing the fee floor. Order one sample of the name you would advertise first. Match the photo and the variant to the page before you spend.',
          `Save that shortlist in a free account when you want it to stay. A free account can save 10 products. Pro is ${PRO_PRICE}, billed by Stripe, and removes the free caps on saved products, research-catalog products, and hosted listings. It does not mark a product as winning. Checkout opens after the account exists.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'What counts as a winning dropshipping product here?',
        answer: 'A product you can quote, price above supplier cost and the fee floor, explain to one buyer, and test with a small ad. A "winner" label on another research product is not that.',
      },
      {
        question: 'Should I start from an ad spy or a curated list?',
        answer: 'You can. Treat the name as a candidate. Replace their figures with a quote from a supplier this app can order from, then run the idea checker before you buy ads.',
      },
      {
        question: 'How is this different from the short winning-products guide?',
        answer: '"How to find winning products" is the short sequence. This page is the search method, including what to do with names from other tools. The research page "Winning dropshipping products" is the definition, not the steps.',
      },
    ],
  },
  {
    slug: 'dropshipping-product-validation-checklist',
    title: 'Dropshipping product validation checklist',
    metaTitle: 'Dropshipping product validation checklist',
    description: 'A dropshipping product validation checklist with stop rules: two quotes, a fee check, a sample, and one small test.',
    intent: 'dropshipping product validation checklist',
    howTo: true,
    relatedResearch: [
      'how-to-validate-a-dropshipping-product',
      'winning-dropshipping-products',
      'how-to-price-a-dropshipping-product',
    ],
    relatedGuides: [
      'how-to-find-winning-dropshipping-products',
      'compare-dropshipping-product-research-tools',
      'what-to-check-before-buying-ads',
    ],
    sections: [
      {
        heading: 'Write one sentence or stop',
        paragraphs: [
          'Write the product, the buyer, and the reason they would pick your page. If you cannot, do not collect more names. This checklist starts with an offer, not a keyword.',
          'The product research checklist on this site is the list of facts to collect. This page is the pass-or-fail order: quote, fee floor, sample, a ship window on the page, then one small test.',
        ],
      },
      {
        heading: 'Get two quotes for the same variant',
        paragraphs: [
          'Ask two suppliers for product cost, the shipping you pay, processing days, and transit days to one country. The supplier comparison adds landed cost and total days from those numbers. A supplier who will not ship to the country is out, even with a lower product cost.',
          'If only one supplier can ship the variant, write that down. You can still test, and the first ad stays small because you have no backup.',
        ],
      },
      {
        heading: 'Fail the price before you fail the ad',
        paragraphs: [
          'Enter the quote and the price you want to charge in the idea checker. The price passes only when the remainder is still positive after supplier cost, the estimated card fee, and the platform fee. Ads and refunds are not in that check.',
          'Enter an ad cost in the profit calculator before you call the offer ready for traffic. A price the checker marks as not viable is a failed check. Change the price, the bundle, or the supplier. Do not advertise it to "make the margin back."',
        ],
      },
      {
        heading: 'Match a sample to the page',
        paragraphs: [
          'Order one unit to your own address. Compare the photo, the variant, and the days it actually took with the page you plan to publish. A listing that does not match the item that arrives fails the check, even when the margin looks fine.',
          'Publish the ship window the supplier confirmed. On the idea checker, longer than 7 days belongs on the page, and longer than 14 days belongs where the buyer decides, before they pay. Those are disclosure rules, not a delivery promise.',
        ],
      },
      {
        heading: 'Run one small test and read refunds',
        paragraphs: [
          'Run one creative to the buyer you named. Stop if refunds cluster on quality, the wrong variant, or a date you did not disclose. A slow first day, by itself, is not a failed check.',
          `The checker, the comparison, and the profit calculator do not require an account. A free account saves the product when the checklist passes. Pro is ${PRO_PRICE} and removes the free caps on saved products and hosted listings when the shortlist, not the checklist, is what is blocked. Checkout opens after the account exists.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Is this the same as the product research checklist?',
        answer: 'No. The research checklist is what to collect. This page is the sequence that passes or fails: two quotes, a fee-safe price, a sample that matches the page, a disclosed ship window, then one small test.',
      },
      {
        question: 'Can comments on a video pass this checklist?',
        answer: 'No. Comments show interest in a clip. The checklist passes on a quote, a fee-safe price, a sample, and a page that matches that sample.',
      },
      {
        question: 'Do I need an account to use the checklist?',
        answer: 'No. The idea checker, the supplier comparison, and the profit calculator run without an account. An account is for saving the shortlist. Pro is the paid plan that removes the free caps.',
      },
    ],
  },
  {
    slug: 'seasonal-dropshipping-niche-ideas',
    title: 'Dropshipping niche ideas by season',
    metaTitle: 'Dropshipping niche ideas by season',
    description: 'Seasonal dropshipping niche ideas for spring, summer, fall, and winter, tied to dates you can check. No demand scores.',
    intent: 'seasonal dropshipping niche ideas',
    howTo: true,
    relatedResearch: [
      'dropshipping-niche-ideas',
      'best-products-to-dropship-in-spring',
      'best-products-to-dropship-in-summer',
      'best-products-to-dropship-in-fall',
      'best-products-to-dropship-in-winter',
    ],
    relatedGuides: [
      'dropshipping-niches-for-beginners',
      'dropshipping-product-validation-checklist',
      'how-to-find-winning-dropshipping-products',
    ],
    sections: [
      {
        heading: 'Pick a date you can still meet',
        paragraphs: [
          'A seasonal niche is a buyer with a date attached, plus a product a supplier can ship before that date. The season research pages list sample products for spring, summer, fall, and winter. Those names are editorial. They are not a ranking and they are not a sales total.',
          'If the supplier\'s longer ship estimate lands after the date, the niche is already late. Do not buy ads to catch a calendar you already missed.',
        ],
      },
      {
        heading: 'Spring and summer buyers',
        paragraphs: [
          'Spring on this site is the run-up to Easter and Mother\'s Day, plus outdoor jobs that start with the first warm weekends. A niche is a gift the buyer still has time to receive, or one outdoor job you can photograph. A Mother\'s Day gift listed when the ship window is longer than the days left fails the date check.',
          'Summer covers heat, travel, Father\'s Day in June, and the Fourth of July. Quote a heat-wave niche while people are still planning weekends, not on the last hot week. Anything that can melt, leak, or sit in a hot truck needs a supplier answer before the ad.',
        ],
      },
      {
        heading: 'Fall and winter buyers',
        paragraphs: [
          'Fall holds Halloween, Thanksgiving, and Black Friday, and Christmas shipping has to be in motion before December when the supplier needs more than a week. Pick one dated event and one product that still makes sense after it. A costume-only niche ends with the event. A warmer-room niche can continue into winter.',
          'Winter splits December gifts from January routines. A Christmas gift has a hard stop. A desk, training, or indoor niche can be tested after December returns settle. Ask what happens to an order placed in the last two weeks of December before you print a date on the page.',
        ],
      },
      {
        heading: 'One niche and one product this week',
        paragraphs: [
          'Choose the season you are actually in. Open that season\'s research page, pick one sample name that matches a buyer you can explain, and get a quote. Then run the validation checklist. The preview can also filter the sample catalog to year-round items if the date has already passed.',
          `A free account saves the shortlist. Pro is ${PRO_PRICE}, billed by Stripe, when you need the free caps on saved products and hosted listings removed. The season pages do not change with the plan, and checkout opens after the account exists.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Which season is the most profitable?',
        answer: 'This site does not rank seasons by profit. The useful question is whether you can sample and deliver before the date on the calendar.',
      },
      {
        question: 'Should a beginner start with a holiday niche?',
        answer: 'Only when the ship window still fits the date. Otherwise start with a year-round buyer and use the season pages as a later test.',
      },
      {
        question: 'Are the sample products demand data?',
        answer: 'No. Audiences, windows, and competition tags in the sample catalog are editorial. Replace them with a supplier quote before you buy ads.',
      },
    ],
  },
  {
    slug: 'compare-dropshipping-product-research-tools',
    title: 'How to compare dropshipping product research tools',
    metaTitle: 'Compare product research tools',
    description: 'How to compare dropshipping product research tools by the question each one answers, then check the name with your own quote.',
    intent: 'compare dropshipping product research tools',
    howTo: true,
    relatedResearch: [
      'dropshipping-product-research-tool',
      'winning-dropshipping-products',
      'aliexpress-product-research',
    ],
    relatedGuides: [
      'sell-the-trend-vs-dropship-scout',
      'minea-vs-dropship-scout',
      'ecomhunt-vs-dropship-scout',
      'dropshipping-product-validation-checklist',
    ],
    sections: [
      {
        heading: 'Name the question the tool answers',
        paragraphs: [
          'Minea describes itself as an ad spy for Facebook, TikTok, and Pinterest ads, with creatives and engagement figures it collects. Ecomhunt describes itself as a hand-picked product list with notes its researchers attach. Sell The Trend describes a product explorer it calls NEXUS, hand-picked lists, ad explorers, and store intelligence on its own site.',
          'Dropship Scout answers a different question: given numbers you type, does the price clear fees, and can a connected supplier fulfill a listing. It does not crawl ad libraries and it does not show another store\'s orders.',
        ],
      },
      {
        heading: 'Separate a prompt from a quote',
        paragraphs: [
          'A product name, an ad creative, and a saturation label are prompts. A quote is product cost, the shipping you pay, ship days, and the countries served, from a supplier you can order from. This app orders from CJ Dropshipping, Printful, Printify, and a direct supplier who joined the platform.',
          'A figure on another site does not become that quote. If their supplier is not one this app can order from, the name stays a research note until you find one that is.',
        ],
      },
      {
        heading: 'Leave their claims on their site',
        paragraphs: [
          'These pages describe what those companies say their products are for. They do not repeat database sizes, user counts, rankings, or revenue screenshots, because this site cannot verify them. Do not put those figures on your product page either.',
          'Your page can say the price, the variant, and the ship window you confirmed. That is the part a buyer can hold you to.',
        ],
      },
      {
        heading: 'Bring the name into the free tools',
        paragraphs: [
          'Compare two quotes in the supplier comparison. Check the price in the idea checker. Add an ad cost in the profit calculator. None of those pages stores the numbers, and none of them starts checkout.',
          `Save the shortlist in a free account when you want it kept. Pro is ${PRO_PRICE}, billed by Stripe, and removes the free caps on saved products and hosted listings. It does not add an ad library. Checkout opens after the account exists.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Dropship Scout an ad spy?',
        answer: 'No. It does not crawl Facebook, TikTok, or Pinterest ads, and it does not show another store\'s orders. The profit calculator uses an ad cost you type.',
      },
      {
        question: 'Should I cancel another research tool?',
        answer: 'This page does not tell you to. If that tool helps you find names, keep using it for names. Use this site for the quote, the fee check, and fulfillment.',
      },
      {
        question: 'Where are the side-by-side pages?',
        answer: 'Sell The Trend, Minea, and Ecomhunt each have a page that states what that product says it does and what Dropship Scout does. They are descriptions, not rankings and not reviews.',
      },
    ],
  },
  {
    slug: 'sell-the-trend-vs-dropship-scout',
    title: 'Sell The Trend vs Dropship Scout',
    metaTitle: 'Sell The Trend vs Dropship Scout',
    description: 'What Sell The Trend says it offers, what Dropship Scout does, and how to check a product name with your own supplier quote.',
    intent: 'Sell The Trend vs Dropship Scout',
    relatedResearch: [
      'dropshipping-product-research-tool',
      'winning-dropshipping-products',
      'how-to-validate-a-dropshipping-product',
    ],
    relatedGuides: [
      'compare-dropshipping-product-research-tools',
      'minea-vs-dropship-scout',
      'ecomhunt-vs-dropship-scout',
      'dropshipping-product-validation-checklist',
    ],
    sections: [
      {
        heading: 'What Sell The Trend says it is',
        paragraphs: [
          'Sell The Trend describes itself, on sellthetrend.com, as a dropshipping product research platform. The features it names include a product explorer called NEXUS, hand-picked product lists, Facebook and TikTok ad explorers, and store intelligence. This page uses those names so you can tell the products apart.',
          'It does not confirm how large that catalog is, how any score is calculated, or any sales total published there. Prices and plan names on that site change. This page does not quote them.',
        ],
      },
      {
        heading: 'What you can do on Dropship Scout',
        paragraphs: [
          'The public tools are the idea checker, the supplier comparison, and the profit calculator. None of them require an account, and none of them look up another store\'s orders. The dashboard includes a sample catalog labeled as sample data.',
          'Signed-in sellers can import from CJ Dropshipping, Printful, Printify, or a direct supplier, and publish a hosted store or push a listing to Shopify. There is no Sell The Trend connection. You type the quote, or you import from one of those suppliers.',
        ],
      },
      {
        heading: 'What to do with a name you found there',
        paragraphs: [
          'Copy the product name, not a revenue line. Ask a supplier this app can order from for cost, shipping, and days on one variant. If their supplier is not one of those, the name stays a research note until you find one that is. Then run the validation checklist and order a sample.',
          `Free accounts can save 10 products and push 3 research-catalog products to Shopify per calendar month. Pro is ${PRO_PRICE}, billed by Stripe, and removes those caps. Live CJ discovery is on Pro when this deployment has a CJ token. Checkout opens after the account exists. Pro does not add their product explorer.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Does Dropship Scout import products from Sell The Trend?',
        answer: 'No. There is no integration. Import uses CJ Dropshipping, Printful, Printify, or a direct supplier who joined this platform.',
      },
      {
        question: 'Are their winning-product labels verified here?',
        answer: 'No. A label on another site is their editorial or their data. This site will not repeat it as a fact, and it will not invent a replacement sales figure.',
      },
      {
        question: 'Which product picks what I should sell?',
        answer: 'Neither page on this site picks it for you. Sell The Trend, by its own description, surfaces products. You still price and sample the one you would actually sell.',
      },
    ],
  },
  {
    slug: 'minea-vs-dropship-scout',
    title: 'Minea vs Dropship Scout',
    metaTitle: 'Minea vs Dropship Scout',
    description: 'What Minea\'s ad spy is for, and what to check on an advertised product before you treat it as a winner. No borrowed sales figures.',
    intent: 'Minea vs Dropship Scout',
    relatedResearch: [
      'tiktok-trending-products-to-sell',
      'how-to-validate-a-dropshipping-product',
      'dropshipping-product-research-tool',
    ],
    relatedGuides: [
      'compare-dropshipping-product-research-tools',
      'sell-the-trend-vs-dropship-scout',
      'ecomhunt-vs-dropship-scout',
      'tiktok-made-me-buy-it-products',
    ],
    sections: [
      {
        heading: 'What Minea says it is',
        paragraphs: [
          'Minea describes itself as an ad spy. Its site says it covers Facebook, TikTok, and Pinterest ads and shows creatives plus engagement and spend signals it collects. This page does not repeat the size of that library or any user count, because this site cannot verify them.',
          'An ad that is running tells you someone is paying to show that creative. It does not tell you their profit, their refund rate, or the ship window your supplier will meet.',
        ],
      },
      {
        heading: 'What the ad still leaves you to check',
        paragraphs: [
          'Write down the product in the ad, the claim the ad makes, and the variant you can see. Then ask whether a supplier you can order from ships that variant. If the sample does not match the ad, do not imply the advertised product is what you sell.',
          'Dropship Scout does not store or search an ad library. The idea checker uses the cost and price you type. The profit calculator uses an ad cost you type. Neither one reads an ad account.',
        ],
      },
      {
        heading: 'When the ad is a reason to stop',
        paragraphs: [
          'Stop when the only difference you can offer is the same factory photo, when the ship window is slower than the ad implies and you would have to hide it, or when the price does not clear fees. A crowded set of similar ads means buyers already see the item. It is not an order count.',
          `The free tools stay free. A free account saves the shortlist. Pro is ${PRO_PRICE}, billed by Stripe, when the caps on saved products and hosted listings are what block you. Pro does not turn on an ad spy. Checkout opens after the account exists.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I validate a TikTok ad I found in Minea?',
        answer: 'Use the ad as a candidate. Validation on this site is a supplier quote, a fee check, and a sample. Engagement figures stay on Minea. They are not copied here.',
      },
      {
        question: 'Does Dropship Scout track ad spend?',
        answer: 'No. Enter an ad cost per sale in the profit calculator if you have one from a test, or leave it blank to see the ceiling. The page does not connect to an ad account.',
      },
      {
        question: 'Is a long-running ad proof the product is profitable?',
        answer: 'No. It shows the advertiser kept the ad on. Your supplier cost, refunds, and ship window can still make the same product a loss.',
      },
    ],
  },
  {
    slug: 'ecomhunt-vs-dropship-scout',
    title: 'Ecomhunt vs Dropship Scout',
    metaTitle: 'Ecomhunt vs Dropship Scout',
    description: 'What Ecomhunt\'s hand-picked list is for, and how to validate one product name with a supplier quote instead of their label.',
    intent: 'Ecomhunt vs Dropship Scout',
    relatedResearch: [
      'winning-dropshipping-products',
      'low-competition-products-to-dropship',
      'dropshipping-product-research-tool',
    ],
    relatedGuides: [
      'compare-dropshipping-product-research-tools',
      'sell-the-trend-vs-dropship-scout',
      'minea-vs-dropship-scout',
      'how-to-spot-saturated-products',
    ],
    sections: [
      {
        heading: 'What Ecomhunt says it is',
        paragraphs: [
          'Ecomhunt describes itself as a hand-picked dropshipping product list. Its site talks about products chosen by its researchers, saturation notes, ad examples, and supplier comparisons inside that product. A hand-picked label is their choice of what to publish.',
          'This page does not audit that choice, and it does not repeat their product counts or any sales figure. Plan prices on that site change, so they are not quoted here.',
        ],
      },
      {
        heading: 'A curated name is still a name',
        paragraphs: [
          'Take one product from a list like that and write the buyer yourself. If you can only repeat their targeting notes, you do not have an offer yet. Look up the variant with a supplier this app can fulfill: CJ Dropshipping, Printful, Printify, or a direct supplier.',
          'A supplier link that points somewhere this app cannot order is a research note. It is not a product you can publish on the hosted store.',
        ],
      },
      {
        heading: 'Check the crowd with your own search',
        paragraphs: [
          'Search the exact item. If the first screen is the same photo and the same promise, treat it as crowded whether or not a saturation score says so. Then run the idea checker. A score on another site is not an input here. The inputs are cost, price, shipping, and days.',
          `Save products you are actually quoting. Free keeps a capped shortlist of 10 saved products. Pro is ${PRO_PRICE}, billed by Stripe, and removes the saved-product, research-catalog, and hosted-listing caps. A curated list you pay for elsewhere stays their product. This app does not sync it. Checkout opens after the account exists.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Should I treat a hand-picked winner as verified?',
        answer: 'Treat it as a suggestion. The quote, the sample, and the fee check you run yourself are the parts this site will stand behind.',
      },
      {
        question: 'Does Dropship Scout publish a daily product list?',
        answer: 'No. The sample catalog is a fixed editorial set you can filter by niche and season. It is not a daily feed of claimed winners, and it does not report live sales.',
      },
      {
        question: 'Can I compare their supplier with one I can order here?',
        answer: 'Yes, when you have both quotes. Put them in the supplier comparison. Keep the supplier this app can order from if you want the hosted store to fulfill the item.',
      },
    ],
  },
]
