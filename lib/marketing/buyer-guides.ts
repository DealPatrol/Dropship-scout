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
]
