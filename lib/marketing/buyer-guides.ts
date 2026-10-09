import type { Guide } from '@/lib/marketing/content'

/** Buyer-intent guides: ad math, small-budget testing, and return policies. */
export const BUYER_GUIDES: Guide[] = [
  {
    slug: 'dropshipping-break-even-roas',
    title: 'How to calculate break-even ROAS for a dropshipping product',
    metaTitle: 'Break-even ROAS for dropshipping',
    description: 'Work out the most you can spend on ads per sale before a dropshipping product loses money, using supplier cost, shipping, and fees.',
    intent: 'break even roas dropshipping',
    relatedResearch: ['how-to-validate-a-dropshipping-product', 'dropshipping-product-research-tool'],
    sections: [
      {
        heading: 'Start with contribution per order',
        paragraphs: [
          'Take the price the customer pays, then subtract supplier cost, shipping, payment processing fees, and any platform fee. What is left is the contribution per order: the money available to pay for advertising and profit.',
          'Example: a $39.99 sale with a $12 supplier cost, $6 shipping, and about $1.46 in card fees (2.9% plus 30 cents is a common US card rate) leaves roughly $20.53 before ads.',
        ],
      },
      {
        heading: 'Turn it into break-even ROAS',
        paragraphs: [
          'Break-even ROAS is the sale price divided by the contribution per order. In the example, $39.99 / $20.53 is about 1.95. If your ads return less than $1.95 in revenue for every $1 spent, each sale loses money.',
          'Your maximum cost per purchase is the contribution itself, about $20.53 here. Anything below that is profit; anything above is a loss.',
        ],
      },
      {
        heading: 'Leave room for refunds and returns',
        paragraphs: [
          'Refunds, chargebacks, and replacement shipments come out of the same contribution. Set aside a percentage based on your supplier and category before you treat the margin as profit.',
          'If the break-even ROAS is above 3, the product usually needs a higher price, a cheaper supplier, or a bundle before it is worth testing with paid traffic.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is a good break-even ROAS for dropshipping?',
        answer: 'Lower is safer. A break-even ROAS under 2 leaves more room for testing creative and audiences. There is no universal target, because it depends on your own cost, shipping, and fees.',
      },
      {
        question: 'Does Dropship Scout calculate fees for me?',
        answer: 'Yes. Before a listing can be published, the price must cover supplier cost, shipping, an estimated card fee, and the platform fee. The idea checker helps you sanity-check a product before you quote it.',
      },
      {
        question: 'Should I include ad spend in the product price?',
        answer: 'Price for the market first, then check the numbers. If the contribution per order cannot cover a realistic cost per purchase, the product is not ready for paid ads.',
      },
    ],
  },
  {
    slug: 'how-to-test-a-product-with-a-small-ad-budget',
    title: 'How to test a dropshipping product with a small ad budget',
    metaTitle: 'Test a product on a small ad budget',
    description: 'A step-by-step plan for testing a dropshipping product with limited ad spend: set a kill rule, test one offer, and read the right numbers.',
    intent: 'test dropshipping product small budget',
    relatedResearch: ['how-to-validate-a-dropshipping-product', 'low-competition-products-to-dropship'],
    sections: [
      {
        heading: 'Validate before you spend',
        paragraphs: [
          'Before any ad runs, confirm a supplier can ship the product to your market in a reasonable time and get a written quote. Check the break-even ROAS so you know your maximum cost per purchase.',
          'Order a sample if you can. Photos and video of the real item make better ads than supplier images, and you learn the real delivery time.',
        ],
      },
      {
        heading: 'Set a budget and a kill rule in advance',
        paragraphs: [
          'Decide the total you are willing to lose on the test, and the result that ends it. A common rule: stop when spend reaches your maximum cost per purchase with no sale, or once spend passes two to three times that number without profitable sales.',
          'Writing the rule down before launch keeps you from chasing a losing product.',
        ],
      },
      {
        heading: 'Test one offer at a time',
        paragraphs: [
          'Keep the product, price, and landing page fixed while you test creative. Changing everything at once makes the result impossible to read.',
          'Watch click-through rate, cost per click, add-to-cart rate, and cost per purchase. A high click-through rate with no add-to-carts usually points to the price or the product page rather than the ad.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How much should I spend testing one product?',
        answer: 'Set the test budget from your own numbers: at least enough to reach your maximum cost per purchase a few times. Only spend money you can afford to lose.',
      },
      {
        question: 'How long should a product test run?',
        answer: 'Long enough for the ad platform to deliver your budget and for you to reach your kill rule or a profitable result. Decide the rule before you start.',
      },
      {
        question: 'Can Dropship Scout tell me which product will win?',
        answer: 'No tool can promise that. Dropship Scout helps you check the buyer, the supplier, and the fee math before you spend, so the tests you run are on products that can make money if they sell.',
      },
    ],
  },
  {
    slug: 'dropshipping-return-policy',
    title: 'How to write a dropshipping return policy you can honor',
    metaTitle: 'Dropshipping return policy guide',
    description: 'Write a dropshipping return and refund policy that matches what your supplier will actually accept, with a checklist of what to include.',
    intent: 'dropshipping return policy',
    relatedResearch: ['how-to-validate-a-dropshipping-product'],
    sections: [
      {
        heading: 'Start from the supplier policy',
        paragraphs: [
          'Your return policy can only promise what your supplier will honor, or what you are willing to pay for yourself. Read the supplier terms for damaged items, wrong items, and change-of-mind returns before you publish anything.',
          'Many overseas suppliers do not accept change-of-mind returns at all, and return shipping can cost more than the item. Decide in advance whether you will refund without a return in those cases.',
        ],
      },
      {
        heading: 'What to include',
        paragraphs: [
          'State the return window, which items qualify, who pays return shipping, where returns go, and how long refunds take. Explain what happens with damaged or lost orders, and how a customer should contact you with photos.',
          'Card networks and local consumer laws can give buyers rights beyond your policy. Check the rules for the countries you sell to.',
        ],
      },
      {
        heading: 'Price for refunds',
        paragraphs: [
          'Refunds and replacements are a cost of doing business. Include an allowance for them in your margin, and revisit it once you have real order data.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do dropshipping customers send returns to me or the supplier?',
        answer: 'It depends on the supplier. Some provide a return address, some do not accept returns. Your policy should give the address that actually applies, never a supplier warehouse that will reject the package.',
      },
      {
        question: 'Can I refund without asking for the item back?',
        answer: 'Yes. For low-cost items, refunding or reshipping without a return is often cheaper than paying international return shipping. Decide your threshold in advance.',
      },
      {
        question: 'Is a no-returns policy allowed?',
        answer: 'Consumer protection laws in many places give buyers rights for faulty or misdescribed goods regardless of your policy. Get local advice before relying on a no-returns policy.',
      },
    ],
  },
  {
    slug: 'how-to-order-dropshipping-product-samples',
    title: 'How to order dropshipping product samples before you sell',
    metaTitle: 'How to order dropshipping samples',
    description: 'What to check when you order a sample from a dropshipping supplier: build quality, packaging, real shipping time, and whether the photos match.',
    intent: 'dropshipping product samples',
    relatedResearch: ['how-to-validate-a-dropshipping-product', 'aliexpress-product-research'],
    sections: [
      {
        heading: 'Order it the way a customer would',
        paragraphs: [
          'Place the sample order to your own address, with the same shipping option you plan to offer. That shows the real delivery time and the packaging a customer will open, not a best-case quote.',
          'Write down the order date, ship date, and delivery date. Compare them with the shipping time on the supplier listing.',
        ],
      },
      {
        heading: 'What to check when it arrives',
        paragraphs: [
          'Compare the product with the supplier photos: size, color, material, and any printed text. Use it for a few days. Note anything that would make a customer ask for a refund.',
          'Check the packaging for supplier branding, invoices with prices, or damage. Those details reach your customer too.',
        ],
      },
      {
        heading: 'Use the sample for your own photos',
        paragraphs: [
          'A sample lets you take photos and short videos of the real product. That is often clearer than reusing supplier images, and it shows customers what actually arrives.',
          'If the sample fails, that is a cheap result. You found the problem before paying for ads.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is ordering a sample worth the cost?',
        answer: 'Usually, yes. One sample costs far less than refunds and chargebacks from a product that does not match its photos.',
      },
      {
        question: 'Should I order from more than one supplier?',
        answer: 'If you can, yes. Comparing two samples side by side shows differences in quality, packaging, and shipping time.',
      },
      {
        question: 'Can I check a product before ordering a sample?',
        answer: 'Yes. The idea checker on Dropship Scout gives a quick read on a product idea without an account, before you spend money on a sample.',
      },
    ],
  },
  {
    slug: 'how-to-handle-dropshipping-chargebacks',
    title: 'How to handle dropshipping chargebacks and payment disputes',
    metaTitle: 'Dropshipping chargebacks and disputes',
    description: 'Why dropshipping orders get disputed, what evidence to keep for each order, and how to lower chargebacks with clear shipping times and tracking.',
    intent: 'dropshipping chargebacks',
    relatedResearch: ['how-to-validate-a-dropshipping-product', 'winning-dropshipping-products'],
    sections: [
      {
        heading: 'Why dropshipping orders get disputed',
        paragraphs: [
          'Common reasons are an order that has not arrived, a product that does not match the listing, or a charge the customer does not recognize. Long shipping times make the first one more likely.',
          'Each dispute usually costs the sale, the product cost, and a dispute fee from your payment processor. Check your processor for its current fee.',
        ],
      },
      {
        heading: 'Keep evidence for every order',
        paragraphs: [
          'Save the order confirmation, the shipping confirmation with tracking, proof of delivery, and any messages with the customer. Most processors ask for these when you respond to a dispute.',
          'Make sure the business name on the card statement is one customers will recognize.',
        ],
      },
      {
        heading: 'Prevent disputes before they start',
        paragraphs: [
          'State realistic shipping times on the product page and in the confirmation email. Send tracking as soon as you have it.',
          'Answer customer emails quickly. A customer who gets a refund or a reply from you is less likely to go to their bank.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Should I refund instead of fighting a dispute?',
        answer: 'If the customer has a real problem, a quick refund is often cheaper than a dispute. Respond with evidence when the order was delivered as described.',
      },
      {
        question: 'Do long shipping times cause chargebacks?',
        answer: 'They make "item not received" disputes more likely. Show the real delivery window before purchase and send tracking promptly.',
      },
      {
        question: 'Do product prices on Dropship Scout account for refunds?',
        answer: 'Listings must cover supplier cost, shipping, an estimated card fee, and the platform fee. Set aside extra margin for refunds and disputes yourself.',
      },
    ],
  },
  {
    slug: 'what-to-do-when-a-dropshipping-order-is-late',
    title: 'What to do when a dropshipping order is late',
    metaTitle: 'When a dropshipping order is late',
    description: 'Steps to take when a dropshipping order is late: check tracking, contact the supplier, and send the customer an honest update before they ask.',
    intent: 'dropshipping order late',
    relatedResearch: ['how-to-validate-a-dropshipping-product', 'dropshipping-product-research-tool'],
    sections: [
      {
        heading: 'Check tracking first',
        paragraphs: [
          'Look up the tracking number on the carrier site, not only the supplier page. Note the last scan and where the package is.',
          'If there is no tracking or no scan for several days, contact the supplier and ask for a status update in writing.',
        ],
      },
      {
        heading: 'Tell the customer before they ask',
        paragraphs: [
          'Send a short, honest update: the order is delayed, where it is now, and when you will update them next. Do not promise a delivery date you cannot control.',
          'Offer a clear option if it does not arrive by a set date, such as a replacement or a refund.',
        ],
      },
      {
        heading: 'Fix the cause',
        paragraphs: [
          'If one supplier is late again and again, test a second supplier for the same product. Update the shipping time on the product page to match what customers actually experience.',
          'Track late orders by supplier and product so you can see patterns.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long should I wait before refunding a late order?',
        answer: 'Set a clear cutoff based on the shipping time you showed at checkout, and tell the customer what it is. Refund or replace once it passes.',
      },
      {
        question: 'Should I blame the supplier when talking to the customer?',
        answer: 'No. The customer bought from you. Apologize, give the facts you have, and say what you will do next.',
      },
      {
        question: 'How do I avoid late orders in the first place?',
        answer: 'Order a sample to see the real shipping time, show honest delivery estimates, and keep a second supplier for products that sell.',
      },
    ],
  },
]
