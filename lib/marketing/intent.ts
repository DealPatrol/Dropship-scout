import type { Season } from '@/lib/merchandising/types'
import { SEASON_LABELS } from '@/lib/merchandising/seasonal'
import { LONG_TAIL_PAGES } from '@/lib/marketing/long-tail'

export type IntentKind = 'season' | 'short-form' | 'low-competition' | 'niches' | 'article'

export interface IntentSection {
  heading: string
  paragraphs: string[]
}

export interface IntentFaq {
  question: string
  answer: string
}

export interface IntentPage {
  slug: string
  title: string
  metaTitle: string
  description: string
  kind: IntentKind
  season?: Season
  sections: IntentSection[]
  faqs: IntentFaq[]
  related: string[]
}

const SHARED_FAQ: IntentFaq = {
  question: 'Does Dropship Scout publish live sales numbers?',
  answer: 'No. The public preview and the built-in catalog are sample records. Search ideas, when AI search is configured, are labeled the same way. A supplier quote is the number to use before you buy ads.',
}

const SEASON_BODY: Record<Season, { timing: string; checks: string; holidays: string }> = {
  spring: {
    timing: 'Spring buying starts before the weather feels like spring. Easter and Mother\'s Day land in this window, and outdoor products need photos that match the first warm weekends. If a supplier\'s stated ship time is longer than a week, a Mother\'s Day gift listed in May is already late.',
    checks: 'Order one sample in March. Confirm the package weight, the return address, and whether the supplier can ship to your customer\'s country without a surprise fee. Then write the product page around one buyer: a gift, a yard, or a commute. Do not list a summer item just because the calendar turned.',
    holidays: 'Easter is in April and Mother\'s Day is in May. Gift products need a backup ship date, not a promise you cannot keep if the supplier slips.',
  },
  summer: {
    timing: 'Summer demand is tied to heat, travel, and time outside. Father\'s Day is in June and the Fourth of July is in July. A product that only makes sense in a heat wave should be tested while people are still planning weekends, not on the last hot week.',
    checks: 'Check whether the item can sit in a hot delivery truck. Plastics, batteries, and anything liquid need a supplier answer before you run an ad. Read the ship window against a June or July delivery, and keep the first test small enough that a slow supplier does not strand the whole budget.',
    holidays: 'Father\'s Day gifts and Fourth of July outdoor items are the dated buys. Evergreen car and travel accessories can stay up after the holiday if the sample margin still works once you add shipping.',
  },
  fall: {
    timing: 'Fall is the stocking season, not only the selling season. Halloween is in October. Thanksgiving and Black Friday are in November. Christmas shipping has to be in motion before December if the supplier needs a week or more. A product whose selling window opens in October should be sampled in September.',
    checks: 'Pick one dated event and one product that still makes sense after that event. A heated or indoor item can carry into winter. A costume-only item cannot. Compare the supplier ship time with the date you would stop advertising, and do not scale a test you have not received yourself.',
    holidays: 'Halloween, Thanksgiving, and Black Friday sit inside fall. Christmas is the next month. The useful question is whether you can photograph, list, and deliver before the cutoff, not whether a catalog calls the item a winner.',
  },
  winter: {
    timing: 'December is a cutoff month. If the supplier cannot ship in time for Christmas, say so on the page or sell the item as a January gift. January is when people buy for a routine they just started: training, a desk, a warmer room. That is a calendar pattern, not a measured sales total.',
    checks: 'Separate holiday gifts from January routine products. The gift has a hard stop. The routine product can be tested with a small budget after the returns from December settle. Ask the supplier what happens to an order placed in the last two weeks of December.',
    holidays: 'Christmas dominates December. January and February favor indoor and fitness products in the sample catalog. Treat those as hypotheses and confirm cost, ship time, and a real product photo before you scale.',
  },
}

function seasonPage(season: Season): IntentPage {
  const label = SEASON_LABELS[season].label.toLowerCase()
  const body = SEASON_BODY[season]
  return {
    slug: `best-products-to-dropship-in-${season}`,
    title: `Best products to dropship in ${label}`,
    metaTitle: `Best products to dropship in ${label}`,
    description: `How to choose ${label} dropshipping products using ship time, margin, and a sample catalog. No invented sales totals.`,
    kind: 'season',
    season,
    related: ['winning-dropshipping-products', 'how-to-validate-a-dropshipping-product', 'dropshipping-product-research-tool'],
    sections: [
      {
        heading: `What to decide before ${label}`,
        paragraphs: [
          body.timing,
          'The list lower on this page is pulled from Dropship Scout\'s built-in sample catalog. Names, audiences, and selling windows are editorial sample fields. They are not a ranking by orders, revenue, or ad spend.',
        ],
      },
      {
        heading: 'A practical check before you advertise',
        paragraphs: [body.checks, body.holidays],
      },
      {
        heading: 'Where a paid plan fits',
        paragraphs: [
          'A free account can save a short list and keep a small research catalog. Pro removes those caps and is billed through Stripe Checkout after you create an account. The hosted store still rejects a listing whose price cannot cover supplier cost, estimated card fees, and the platform fee.',
        ],
      },
    ],
    faqs: [
      SHARED_FAQ,
      {
        question: `Should I only sell ${label} products?`,
        answer: `No. Use ${label} for products with a real date attached, and keep a few year-round products so the store is not empty when the holiday ends. The preview can filter the sample catalog to year-round items.`,
      },
    ],
  }
}

const ARTICLES: IntentPage[] = [
  {
    slug: 'winning-dropshipping-products',
    title: 'Winning dropshipping products',
    metaTitle: 'Winning dropshipping products',
    description: 'A practical definition of a winning dropshipping product: margin, ship time, and a buyer you can name. No fake order counts.',
    kind: 'article',
    related: ['how-to-validate-a-dropshipping-product', 'how-to-price-a-dropshipping-product', 'low-competition-products-to-dropship'],
    sections: [
      {
        heading: 'Winning means you can explain the sale',
        paragraphs: [
          'A winning product is one you can describe in a sentence: who buys it, why they buy it this month, and what it costs you to deliver. A screenshot of someone else\'s revenue is not that sentence. Dropship Scout does not invent order totals to make a product look proven.',
          'Start with the buyer. A waterproof seat cover is for someone who drives with a dog. A doorway pull-up bar is for someone in an apartment. If you cannot name the buyer, you also cannot write the ad or the product page.',
        ],
      },
      {
        heading: 'The checks that matter before ads',
        paragraphs: [
          'Ask for a supplier cost and a ship time in writing. Add shipping, a card fee, and a refund reserve before you call the margin acceptable. On the hosted store, a listing is rejected when the price cannot clear supplier cost, an estimated card fee, and the platform fee. That is a floor, not a promise of profit after ads.',
          'Then check whether a second supplier can ship the same item. A single supplier is a single point of failure on the week you get your first orders. Competition matters only after you can tell your listing apart in the first photo: a bundle, a clearer audience, or a use the generic listing ignores.',
        ],
      },
      {
        heading: 'Use the sample catalog as a shortlist, then verify it',
        paragraphs: [
          'The free preview filters the built-in sample catalog by season, niche, and a sample competition tag. Those tags are editorial. Open a supplier, get a quote, and order a sample before you spend on ads. Save the products you are actually checking so the list is yours, not a feed of claims.',
        ],
      },
    ],
    faqs: [
      SHARED_FAQ,
      {
        question: 'What should I ignore in a product research tool?',
        answer: 'Ignore any unit-sales or revenue figure the tool cannot tie to a source you can open. Ignore a score that does not tell you the ship time, the cost, and the buyer.',
      },
    ],
  },
  {
    slug: 'dropshipping-product-research-tool',
    title: 'Dropshipping product research tool',
    metaTitle: 'Dropshipping product research tool',
    description: 'What Dropship Scout does as a product research tool: sample catalog, supplier import, and Stripe billing for Pro.',
    kind: 'article',
    related: ['winning-dropshipping-products', 'dropshipping-product-page', 'shopify-product-research'],
    sections: [
      {
        heading: 'What you can do on the free plan',
        paragraphs: [
          'Create an account and open the dashboard. The built-in catalog is a curated sample you can filter by niche and season. Free accounts can save 10 products, keep 25 research-catalog products, build 10 products at a time, and push 3 research-catalog products to Shopify per calendar month. The public preview shows a slice of that sample catalog without an account.',
          'Search, when an Anthropic key is configured on the deployment, suggests product ideas. Those suggestions are not measured sales. The sales field is stored as not verified. Use them to decide what to ask a supplier, not as a market report.',
        ],
      },
      {
        heading: 'What Pro changes',
        paragraphs: [
          'Pro removes the saved-product, research-catalog, catalog-build, and research-catalog Shopify push caps. The live CJ discovery adapter is available on Pro when the deployment has a CJ token. Storefront import from CJ, Printful, and Printify uses the platform keys and is available to signed-in sellers on either plan.',
          'You start Pro from the pricing page. A new visitor creates an account and is sent to Stripe Checkout. Someone who already has an account signs in and is sent to the same checkout. Settings uses checkout again if the subscription is not active, including after an abandoned checkout that already created a Stripe customer.',
        ],
      },
      {
        heading: 'What this tool will not pretend to know',
        paragraphs: [
          'It will not show you another store\'s orders. It will not tell you that a product made a dollar amount last month. Supplier cost, ship time, and whether you can publish a price that clears fees are the facts it can help you collect. The hosted storefront, cart, and Stripe payout split are there when you are ready to sell, and Shopify or WooCommerce can be connected later.',
        ],
      },
    ],
    faqs: [
      SHARED_FAQ,
      {
        question: 'Do I need Shopify to use the research tool?',
        answer: 'No. Research, the sample catalog, and the hosted storefront work without Shopify. Shopify is an optional place to push listings, with a monthly cap on the free plan.',
      },
    ],
  },
  {
    slug: 'shopify-product-research',
    title: 'Shopify product research',
    metaTitle: 'Shopify product research',
    description: 'How to research products for a Shopify store: supplier cost, ship time, and a listing you can tell apart.',
    kind: 'article',
    related: ['what-to-sell-in-a-shopify-store', 'shopify-vs-hosted-dropshipping', 'winning-dropshipping-products'],
    sections: [
      {
        heading: 'Research the product before you open the theme',
        paragraphs: [
          'A Shopify store does not make a product easier to fulfill. You still need a supplier cost, a ship time, and a page that explains one use. Start there. Theme work can wait until a sample has arrived and the price clears product cost, shipping, and fees.',
          'Dropship Scout can push a research-catalog product to Shopify when you have connected a custom-app Admin API token with write access to products. Free accounts get 3 of those research pushes per calendar month. Pro removes that cap. The hosted storefront remains available if you do not want a Shopify bill yet.',
        ],
      },
      {
        heading: 'What to collect for each candidate',
        paragraphs: [
          'Write down the supplier, the variant you would actually sell, the quoted cost, the ship window, and the countries they will not ship to. Add your target retail only after those numbers exist. A sample margin from the built-in catalog is a planning sketch. Replace it with the quote.',
          'Look at the first screen of competing Shopify listings for that exact item. If every photo is the same factory image, your test is the photo and the bundle, not a claim that the product is unsaturated. Low competition in a sample catalog is a tag to investigate, not a conclusion.',
        ],
      },
      {
        heading: 'Push less, learn faster',
        paragraphs: [
          'Push the one product you have sampled. Read the first orders for address problems, sizing questions, and refunds before you push a second. Channel orders from Shopify are recorded with the same cost split and do not create a Stripe transfer, because the customer paid Shopify. Know that before you compare payouts with the hosted store.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I research products without connecting Shopify?',
        answer: 'Yes. The sample catalog, preview, and saved products do not require Shopify. Connect Shopify only when you want to push a listing or pull paid orders.',
      },
      SHARED_FAQ,
    ],
  },
  {
    slug: 'tiktok-trending-products-to-sell',
    title: 'TikTok trending products to sell',
    metaTitle: 'TikTok trending products to sell',
    description: 'How to judge products you see on TikTok without treating a view count as a sales figure.',
    kind: 'short-form',
    related: ['winning-dropshipping-products', 'dropshipping-product-photos', 'how-to-validate-a-dropshipping-product'],
    sections: [
      {
        heading: 'A TikTok view is not an order',
        paragraphs: [
          'Short-form video can show you a product people will watch. It does not tell you the cost, the ship time, the refund rate, or how many of those viewers can buy it in your country. Treat a viral clip as a prompt to request a supplier quote.',
          'Dropship Scout does not scrape TikTok or rank products by views. The sample catalog has an editorial tag for items that are often shown in short videos. The list on this page is that tag. It is not a live TikTok trend report and it has no view counts.',
        ],
      },
      {
        heading: 'What to do after you see a clip',
        paragraphs: [
          'Name the buyer in the video and decide whether that buyer is yours. A product demonstrated in a kitchen is a different offer from the same object demonstrated in a car. Then ask a supplier for the variant in the video, not a lookalike with a different plug, size, or material.',
          'Before you pay for ads, order the sample and film your own clip. Factory footage is what every other advertiser will use. Your test is whether you can show the use in one shot and still cover cost, shipping, and fees at the price on the page.',
        ],
      },
      {
        heading: 'TikTok Shop is not connected here',
        paragraphs: [
          'Etsy, eBay, and TikTok Shop are listed in the dashboard as coming soon because their partner APIs need an approved app this deployment does not start. You can still research the product, sell it on the hosted storefront, or push a listing to Shopify or WooCommerce.',
        ],
      },
    ],
    faqs: [
      SHARED_FAQ,
      {
        question: 'Should I sell whatever is on my For You page?',
        answer: 'Only if you can buy a sample, get a ship time, and write an offer for a buyer you can name. A popular clip with a slow supplier is a refund problem, not a product to scale.',
      },
    ],
  },
  {
    slug: 'how-to-validate-a-dropshipping-product',
    title: 'Dropshipping product validation',
    metaTitle: 'Dropshipping product validation',
    description: 'What the sample catalog can tell you when you validate a dropshipping product, and what still needs a supplier quote.',
    kind: 'article',
    related: ['winning-dropshipping-products', 'when-to-stop-testing-a-product', 'aliexpress-product-research'],
    sections: [
      {
        heading: 'Validation is a sequence, not a score',
        paragraphs: [
          'Write the offer in one sentence. Get a quote for the exact variant. Order one unit to your own address. List it only after you know the landed cost and the day it arrived. A score in a dashboard cannot replace those steps.',
          'On the way, throw the idea out if the supplier will not name a ship window, if the sample does not match the photo, or if the price that covers cost and fees is one your buyer will not pay. Those are useful failures. They are cheaper than an ad account.',
        ],
      },
      {
        heading: 'A small test after the sample',
        paragraphs: [
          'Run the smallest ad or post that can reach the buyer you named. Judge it on questions asked, add-to-cart, and whether you can fulfill the order you promised. Do not judge it on a tool\'s estimated monthly revenue. This app does not calculate one.',
          'Save the product in Dropship Scout while you do this so the quote, the niche, and the decision stay next to the listing. Free accounts can save 10 products. That is enough for a first validation queue. Pro removes the cap when the queue is the business.',
        ],
      },
      {
        heading: 'What not to treat as validation',
        paragraphs: [
          'Someone else\'s store revenue, a round order count, and a "hot" badge are not validation. The sample catalog uses editorial trend tags. Read them as labels on a worksheet. The worksheet is done when the supplier quote and the sample agree with the page you want to publish.',
        ],
      },
    ],
    faqs: [
      SHARED_FAQ,
      {
        question: 'How many products should I validate at once?',
        answer: 'One sample in transit and one page being written is enough. A long list of unscanned ideas feels like progress and delays the quote.',
      },
    ],
  },
  {
    slug: 'low-competition-products-to-dropship',
    title: 'Low competition products to dropship',
    metaTitle: 'Low competition products to dropship',
    description: 'How to read a low-competition tag, and which sample-catalog products carry that editorial label.',
    kind: 'low-competition',
    related: ['winning-dropshipping-products', 'dropshipping-profit-margin', 'how-to-validate-a-dropshipping-product'],
    sections: [
      {
        heading: 'Low competition is a claim you have to check',
        paragraphs: [
          'A product can be quiet because the buyer is specific, or because the product is hard to ship, or because nobody wants it. A tag that says low competition does not distinguish those cases. Search the exact product name on the store you plan to sell from and count listings you would actually lose a click to.',
          'The products below are the sample-catalog rows tagged Low. The tag is editorial. It is not a count of Shopify stores, ads, or reviews.',
        ],
      },
      {
        heading: 'What to do with a quiet product',
        paragraphs: [
          'A specific buyer is an advantage if you can reach that person: apartment gyms, new parents, drivers who want a dash camera. Write the page for that person. A quiet product with a vague buyer is usually a product with no message, and the tag will not fix that.',
          'Still get the supplier quote. Quiet products are sometimes quiet because they are expensive to ship or easy to break. The hosted store will not publish a price that cannot clear supplier cost, estimated card fees, and the platform fee.',
        ],
      },
    ],
    faqs: [
      SHARED_FAQ,
      {
        question: 'Is low competition better than high margin?',
        answer: 'Neither number is enough. A quiet product with a thin margin after shipping is still a bad listing. A crowded product with a clear bundle and a margin that survives fees can be the better test.',
      },
    ],
  },
  {
    slug: 'aliexpress-product-research',
    title: 'AliExpress product research',
    metaTitle: 'AliExpress product research',
    description: 'How to research an AliExpress product for dropshipping: variant, ship time, and a price that survives fees.',
    kind: 'article',
    related: ['how-to-read-a-supplier-quote', 'how-to-validate-a-dropshipping-product', 'winning-dropshipping-products'],
    sections: [
      {
        heading: 'Research the listing, not the category',
        paragraphs: [
          'AliExpress search shows you a factory photo and a price that may be for a different variant than the one in the photo. Open the variant you would sell. Note the ship method, the stated handling time, and the countries that method excludes. That row is your research note.',
          'Dropship Scout\'s dashboard search can include AliExpress as a platform filter when you run a search. Results are product ideas with unverified sales fields. They are a shortlist for the listing you are about to open, not a replacement for it.',
        ],
      },
      {
        heading: 'Compare AliExpress with a warehouse supplier',
        paragraphs: [
          'A long ship time changes the product. If the offer only works when it arrives in a few days, an AliExpress ePacket-style window may rule it out, and a CJ, Printful, Printify, or direct supplier may fit. Import those into the hosted catalog when you are ready to sell. The research catalog itself cannot be published on the storefront.',
          'Whichever supplier you pick, re-quote shipping to the address you expect customers to use. A catalog shipping quote in the app uses the deployment\'s quote address. Checkout re-quotes the customer\'s address.',
        ],
      },
      {
        heading: 'Keep the note next to the decision',
        paragraphs: [
          'Save the product with the variant name in your account so you do not re-research the same listing next week. Free saves are capped. When the cap is the thing slowing you down, Pro is the Stripe subscription on the pricing page.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does Dropship Scout place AliExpress orders for me?',
        answer: 'No. AliExpress is a research filter. Fulfillment for the hosted store runs through CJ Dropshipping, Printful, Printify, or a direct supplier who joined the platform.',
      },
      SHARED_FAQ,
    ],
  },
  {
    slug: 'what-to-sell-in-a-shopify-store',
    title: 'What to sell in a Shopify store',
    metaTitle: 'What to sell in a Shopify store',
    description: 'Choose what to sell on Shopify by buyer, ship time, and margin after fees, then connect the store if you want.',
    kind: 'article',
    related: ['shopify-product-research', 'dropshipping-niche-ideas', 'winning-dropshipping-products'],
    sections: [
      {
        heading: 'Sell one offer, not a department store',
        paragraphs: [
          'A new Shopify store converts better when every product could be bought by the same person. Dog travel gear can sit together. A heated blanket, a phone mount, and a yoga mat cannot, unless you have a reason that is stronger than "they all dropship." Pick the person first, then the products.',
          'The niche page on this site lists the sample catalog\'s categories and what each one is for. Use that as a menu of audiences, not as a list of things you must stock.',
        ],
      },
      {
        heading: 'The store is ready when fulfillment is',
        paragraphs: [
          'Connect Shopify from Sales channels with a custom-app token. Dropship Scout checks the token before it is saved. Sync sends published hosted-store listings. Pull imports paid unfulfilled orders into supplier fulfillment in sandbox until you explicitly turn live supplier orders on.',
          'If you do not have Shopify yet, publish the hosted storefront instead. Customers get a product page, a cart, and Stripe Checkout. You can add Shopify later without redoing the supplier work.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How many products should a new Shopify store have?',
        answer: 'Enough that the buyer you named can choose a variant or a bundle, and few enough that you have sampled each one. A handful you can fulfill beats a catalog you have not opened.',
      },
      SHARED_FAQ,
    ],
  },
  {
    slug: 'dropshipping-niche-ideas',
    title: 'Dropshipping niche ideas',
    metaTitle: 'Dropshipping niche ideas',
    description: 'Ten sample-catalog niches and how to pick one based on the buyer, not on a sales chart.',
    kind: 'niches',
    related: ['what-to-sell-in-a-shopify-store', 'second-dropshipping-supplier', 'winning-dropshipping-products'],
    sections: [
      {
        heading: 'A niche is an audience you can reach',
        paragraphs: [
          'Pets, home, fitness, beauty, automotive, baby, electronics, outdoor, office, and fashion are the audiences in the sample catalog. Each description below is the catalog\'s own summary. None of them is a claim about market size.',
          'Choose the audience you can already picture writing to. If you would not know what photo to take, you do not have a niche yet. You have a category name.',
        ],
      },
      {
        heading: 'How to narrow it',
        paragraphs: [
          'Inside a niche, pick a situation. Home is too wide. A renter who wants a warmer bedroom in fall is a situation. Office is too wide. A laptop worker with wrist pain is a situation. The preview filter lets you see sample products in one niche and one season together.',
          'Stay there until you have a supplier quote and a sample. Adding a second niche before the first page is live usually means you are avoiding the quote.',
        ],
      },
    ],
    faqs: [
      SHARED_FAQ,
      {
        question: 'Which niche is the most profitable?',
        answer: 'This site does not rank niches by profit. Profit depends on the quote, the ship time, the fees, and whether your buyer pays the price. Two stores in the same niche can have opposite results.',
      },
    ],
  },
]

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

export function allIntentPages(): IntentPage[] {
  return [...ARTICLES, ...LONG_TAIL_PAGES, ...SEASONS.map(seasonPage)]
}

export function intentBySlug(slug: string): IntentPage | undefined {
  return allIntentPages().find(page => page.slug === slug)
}
