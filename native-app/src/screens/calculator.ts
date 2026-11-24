import { shareText, tap } from '@/lib/native/device'
import { formatUsd } from '@/lib/native/scout-kit'
import { isProfitResult, parseProfitQuote, runProfitQuote, type ProfitQuoteFields } from '@/lib/marketing/profit-calculator'
import { saveCalculator, state } from '../state'
import { clear, field, h, moneyInput, textInput, toast } from '../ui'
import { editItem } from './watchlist'

const FIELDS: Array<{ key: keyof ProfitQuoteFields; label: string; hint?: string; percent?: boolean }> = [
  { key: 'productPrice', label: 'Product price ($)' },
  { key: 'shippingCharge', label: 'Shipping you charge ($)' },
  { key: 'unitCost', label: 'Supplier cost ($)' },
  { key: 'shippingCost', label: 'Shipping you pay ($)' },
  { key: 'adCostPerOrder', label: 'Ad cost per sale ($)' },
  { key: 'paymentFeePercent', label: 'Card fee (%)', percent: true },
  { key: 'paymentFeeFlat', label: 'Card fee flat ($)' },
  { key: 'platformFeePercent', label: 'Platform fee (%)', percent: true },
  { key: 'returnsReservePercent', label: 'Refund reserve (%)', percent: true },
  { key: 'testBudget', label: 'Ad test budget ($)', hint: 'Optional' },
  { key: 'targetProfitPerOrder', label: 'Target profit per order ($)', hint: 'Optional' },
]

function currentFields(): ProfitQuoteFields {
  const s = state.settings
  const c = state.calculator
  return {
    productPrice: c.productPrice ?? '',
    shippingCharge: c.shippingCharge ?? '',
    unitCost: c.unitCost ?? '',
    shippingCost: c.shippingCost ?? '',
    paymentFeePercent: c.paymentFeePercent ?? String(s.paymentFeePercent),
    paymentFeeFlat: c.paymentFeeFlat ?? String(s.paymentFeeFlat),
    platformFeePercent: c.platformFeePercent ?? String(s.platformFeePercent),
    returnsReservePercent: c.returnsReservePercent ?? String(s.returnsReservePercent),
    adCostPerOrder: c.adCostPerOrder ?? '',
    testBudget: c.testBudget ?? '',
    targetProfitPerOrder: c.targetProfitPerOrder ?? '',
  }
}

export function renderCalculator(root: HTMLElement) {
  clear(root)
  const fields = currentFields()
  const name = textInput('name', state.calculator.name ?? '', { placeholder: 'Optional, used when saving' })
  const inputs = new Map<keyof ProfitQuoteFields, HTMLInputElement>()
  const results = h('div', { class: 'card results', 'aria-live': 'polite' })

  const form = h('form', { class: 'stack', novalidate: true },
    field('Product name', name),
    h('div', { class: 'grid2' }, FIELDS.map(f => {
      const input = moneyInput(f.key, fields[f.key], f.percent ? { placeholder: '0' } : {})
      inputs.set(f.key, input)
      return field(f.label, input, f.hint)
    })),
  )
  form.addEventListener('submit', e => e.preventDefault())
  form.addEventListener('input', () => {
    const values: ProfitQuoteFields = { ...fields }
    inputs.forEach((input, key) => { values[key] = input.value })
    void saveCalculator({ ...values, name: name.value })
    draw(values)
  })

  root.append(
    h('header', { class: 'screen-head' }, h('div', {}, h('h1', {}, 'Profit calculator'), h('p', { class: 'muted' }, 'Margin after supplier cost, shipping, card fees, refunds and ads. Works offline.'))),
    results,
    form,
  )
  draw(fields)

  function draw(values: ProfitQuoteFields) {
    clear(results)
    const quote = parseProfitQuote(values)
    if ('error' in quote) {
      results.append(h('p', { class: 'muted' }, quote.error))
      return
    }
    const result = runProfitQuote(quote)
    if (!isProfitResult(result)) {
      results.append(h('p', { class: 'error' }, result.error))
      return
    }
    const e = result.economics
    results.append(
      h('div', { class: 'grid2' },
        big('Net per order', formatUsd(e.netProfitPerOrder), e.netProfitPerOrder >= 0),
        big('Net margin', `${e.netMarginPercent.toFixed(1)}%`, e.netMarginPercent >= 0),
        big('Before ads', formatUsd(e.contributionBeforeAds), e.contributionBeforeAds >= 0),
        big('Break-even CAC', formatUsd(e.breakEvenCAC), e.breakEvenCAC > 0),
        big('Break-even ROAS', e.breakEvenROAS === null ? 'None' : `${e.breakEvenROAS.toFixed(2)}x`, e.breakEvenROAS !== null),
        big('Customer pays', formatUsd(result.customerTotal), true),
      ),
      h('p', {}, h('span', { class: `rec rec-${e.recommendation}` }, e.recommendation), ' ', e.reasons[0] ?? ''),
      h('div', { class: 'toolbar' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => {
          void tap()
          editItem(null, document.getElementById('screen') as HTMLElement, {
            name: name.value.trim(),
            sellPrice: quote.productPrice,
            shippingCharge: quote.shippingCharge,
            supplierCost: quote.unitCost,
            shippingCost: quote.shippingCost,
            adCostPerOrder: quote.adCostPerOrder,
          })
        } }, 'Save to watchlist'),
        h('button', { class: 'btn', type: 'button', onclick: async () => {
          const text = [
            `Profit check${name.value.trim() ? `: ${name.value.trim()}` : ''}`,
            `Customer pays ${formatUsd(result.customerTotal)} · supplier ${formatUsd(quote.unitCost)} + shipping ${formatUsd(quote.shippingCost)}`,
            `Net per order ${formatUsd(e.netProfitPerOrder)} (${e.netMarginPercent.toFixed(1)}%) · break-even CAC ${formatUsd(e.breakEvenCAC)}`,
            `Break-even ROAS ${e.breakEvenROAS === null ? 'none' : `${e.breakEvenROAS.toFixed(2)}x`}`,
            'Scenario math, not a forecast. Made with Dropship Scout.',
          ].join('\n')
          if ((await shareText('Profit check', text)) === 'copied') toast('Copied to the clipboard')
        } }, 'Share'),
      ),
    )
  }
}

function big(label: string, value: string, positive: boolean): HTMLElement {
  return h('div', { class: 'stat' }, h('span', { class: 'muted small' }, label), h('strong', { class: positive ? 'pos' : 'neg' }, value))
}
