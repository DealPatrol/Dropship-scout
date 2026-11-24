import { notify, shareFile, shareText, tap } from '@/lib/native/device'
import {
  WATCH_STATUSES,
  formatUsd,
  marginForItem,
  newId,
  normalizeWatchItem,
  removeById,
  researchCard,
  upsert,
  watchlistCsv,
  type WatchItem,
  type WatchStatus,
} from '@/lib/native/scout-kit'
import { saveWatchlist, state } from '../state'
import { clear, confirmAction, field, formValues, h, moneyInput, select, sheet, textInput, toast } from '../ui'

const STATUS_LABEL: Record<WatchStatus, string> = {
  idea: 'Idea',
  researching: 'Researching',
  testing: 'Testing',
  winner: 'Winner',
  dropped: 'Dropped',
}

let filter: WatchStatus | 'all' = 'all'
let query = ''

export function renderWatchlist(root: HTMLElement, openId?: string) {
  clear(root)
  const list = h('div', { class: 'list' })
  const search = textInput('q', query, { type: 'search', placeholder: 'Search products, tags, notes', 'aria-label': 'Search watchlist' })
  search.addEventListener('input', () => { query = search.value; drawList(list) })

  const chips = h('div', { class: 'chips', role: 'tablist' },
    (['all', ...WATCH_STATUSES] as const).map(status =>
      h('button', {
        type: 'button',
        class: `chip${filter === status ? ' active' : ''}`,
        onclick: () => { filter = status; void tap(); renderWatchlist(root) },
      }, status === 'all' ? `All (${state.watchlist.length})` : STATUS_LABEL[status]),
    ),
  )

  root.append(
    h('header', { class: 'screen-head' },
      h('div', {}, h('h1', {}, 'Watchlist'), h('p', { class: 'muted' }, 'Products you are researching. Saved on this iPhone and available offline.')),
    ),
    h('div', { class: 'toolbar' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => editItem(null, root) }, '+ Add product'),
      h('button', { class: 'btn', type: 'button', disabled: state.watchlist.length === 0, onclick: exportCsv }, 'Export CSV'),
    ),
    search,
    chips,
    list,
  )
  drawList(list)
  if (openId) {
    const item = state.watchlist.find(i => i.id === openId)
    if (item) showItem(item, root)
  }

  function drawList(container: HTMLElement) {
    clear(container)
    const q = query.trim().toLowerCase()
    const items = state.watchlist.filter(item =>
      (filter === 'all' || item.status === filter) &&
      (!q || [item.name, item.category, item.notes, item.tags.join(' ')].join(' ').toLowerCase().includes(q)),
    )
    if (state.watchlist.length === 0) {
      container.append(h('div', { class: 'empty' },
        h('p', { class: 'empty-title' }, 'No products yet'),
        h('p', { class: 'muted' }, 'Add a product idea with its sell price and supplier cost to see the margin after card fees, refunds and ad cost. Products you save from the online Product Explorer also appear here.'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => editItem(null, root) }, 'Add your first product'),
      ))
      return
    }
    if (items.length === 0) {
      container.append(h('p', { class: 'muted center' }, 'No products match.'))
      return
    }
    for (const item of items) container.append(itemCard(item, root))
  }
}

function itemCard(item: WatchItem, root: HTMLElement): HTMLElement {
  const m = marginForItem(item, state.settings)
  return h('button', { type: 'button', class: 'card item-card', onclick: () => showItem(item, root) },
    h('div', { class: 'row space' },
      h('span', { class: 'item-name' }, item.name),
      h('span', { class: `badge status-${item.status}` }, STATUS_LABEL[item.status]),
    ),
    item.category ? h('span', { class: 'muted small' }, item.category) : null,
    m
      ? h('div', { class: 'row metrics' },
          h('span', {}, h('strong', { class: m.netProfitPerOrder >= 0 ? 'pos' : 'neg' }, formatUsd(m.netProfitPerOrder)), ' net / order'),
          h('span', {}, `${m.netMarginPercent.toFixed(1)}% margin`),
          h('span', { class: `rec rec-${m.recommendation}` }, m.recommendation),
        )
      : h('span', { class: 'muted small' }, 'Add a sell price and supplier cost to see the margin'),
  )
}

function showItem(item: WatchItem, root: HTMLElement) {
  const m = marginForItem(item, state.settings)
  const supplier = item.supplierId ? state.suppliers.find(s => s.id === item.supplierId) ?? null : null
  let close = () => {}
  const body = h('div', { class: 'stack' },
    h('div', { class: 'grid2' },
      stat('Sell price', formatUsd(item.sellPrice)),
      stat('Supplier cost', formatUsd(item.supplierCost)),
      stat('Shipping charged', formatUsd(item.shippingCharge ?? 0)),
      stat('Shipping paid', formatUsd(item.shippingCost ?? 0)),
      stat('Ad cost / sale', formatUsd(item.adCostPerOrder ?? 0)),
      stat('Net / order', m ? formatUsd(m.netProfitPerOrder) : '—'),
      stat('Net margin', m ? `${m.netMarginPercent.toFixed(1)}%` : '—'),
      stat('Break-even CAC', m ? formatUsd(m.breakEvenCAC) : '—'),
    ),
    supplier ? h('p', {}, h('span', { class: 'muted' }, 'Supplier: '), `${supplier.name} (${supplier.platform})`) : null,
    item.sourceUrl ? h('p', { class: 'break' }, h('span', { class: 'muted' }, 'Source: '), item.sourceUrl) : null,
    item.tags.length ? h('p', {}, h('span', { class: 'muted' }, 'Tags: '), item.tags.join(', ')) : null,
    item.notes ? h('p', { class: 'notes' }, item.notes) : null,
    field('Status', (() => {
      const s = select('status', WATCH_STATUSES, item.status, STATUS_LABEL)
      s.addEventListener('change', async () => {
        const next = { ...item, status: s.value as WatchStatus, updatedAt: new Date().toISOString() }
        await saveWatchlist(upsert(state.watchlist, next))
        void tap()
        close()
        renderWatchlist(root)
      })
      return s
    })()),
    h('div', { class: 'toolbar' },
      h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        const result = await shareText(`Research card: ${item.name}`, researchCard(item, state.settings, supplier))
        if (result === 'copied') toast('Copied to the clipboard')
      } }, 'Share research card'),
      h('button', { class: 'btn', type: 'button', onclick: () => { close(); editItem(item, root) } }, 'Edit'),
      h('button', { class: 'btn danger', type: 'button', onclick: async () => {
        if (!confirmAction(`Delete “${item.name}” from your watchlist?`)) return
        await saveWatchlist(removeById(state.watchlist, item.id))
        void notify('warning')
        close()
        renderWatchlist(root)
      } }, 'Delete'),
    ),
    h('p', { class: 'muted small' }, 'Scenario math from the numbers you entered, not a sales forecast.'),
  )
  close = sheet(item.name, body)
}

function stat(label: string, value: string): HTMLElement {
  return h('div', { class: 'stat' }, h('span', { class: 'muted small' }, label), h('strong', {}, value))
}

export function editItem(existing: WatchItem | null, root: HTMLElement, prefill: Partial<WatchItem> = {}) {
  const base: Partial<WatchItem> = existing ?? prefill
  const supplierSelect = select('supplierId', ['', ...state.suppliers.map(s => s.id)], base.supplierId ?? '', Object.fromEntries([['', 'None'], ...state.suppliers.map(s => [s.id, s.name])]))
  const form = h('form', { class: 'stack', novalidate: true },
    field('Product name', textInput('name', base.name ?? '', { required: true, maxlength: 140, placeholder: 'e.g. Magnetic phone mount' })),
    field('Category', textInput('category', base.category ?? '', { maxlength: 80, placeholder: 'e.g. Car accessories' })),
    field('Status', select('status', WATCH_STATUSES, base.status ?? 'idea', STATUS_LABEL)),
    h('div', { class: 'grid2' },
      field('Sell price ($)', moneyInput('sellPrice', base.sellPrice ?? null)),
      field('Shipping charged ($)', moneyInput('shippingCharge', base.shippingCharge ?? null)),
      field('Supplier cost ($)', moneyInput('supplierCost', base.supplierCost ?? null)),
      field('Shipping paid ($)', moneyInput('shippingCost', base.shippingCost ?? null)),
      field('Ad cost per sale ($)', moneyInput('adCostPerOrder', base.adCostPerOrder ?? null)),
    ),
    field('Supplier', supplierSelect, state.suppliers.length ? undefined : 'Add suppliers in the Suppliers tab to link them here.'),
    field('Source link', textInput('sourceUrl', base.sourceUrl ?? '', { type: 'url', inputmode: 'url', placeholder: 'https://' })),
    field('Tags', textInput('tags', (base.tags ?? []).join(', '), { placeholder: 'gift, evergreen, TikTok' }), 'Separate with commas'),
    field('Notes', h('textarea', { name: 'notes', rows: 4, maxlength: 4000 }, base.notes ?? '')),
    h('p', { class: 'error', role: 'alert' }),
    h('button', { class: 'btn primary block', type: 'submit' }, existing ? 'Save changes' : 'Add to watchlist'),
  )
  const close = sheet(existing ? 'Edit product' : 'Add product', form)
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const v = formValues(form)
    const now = new Date().toISOString()
    const item = normalizeWatchItem({
      ...v,
      id: existing?.id ?? newId(),
      tags: v.tags.split(',').map(t => t.trim()).filter(Boolean),
      supplierId: v.supplierId || null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    const error = form.querySelector('.error') as HTMLElement
    if (!item) {
      error.textContent = 'Enter a product name.'
      void notify('error')
      return
    }
    for (const key of ['sellPrice', 'shippingCharge', 'supplierCost', 'shippingCost', 'adCostPerOrder'] as const) {
      if (v[key]?.trim() && item[key] === null) {
        error.textContent = 'Amounts must be numbers between 0 and 1,000,000.'
        void notify('error')
        return
      }
    }
    await saveWatchlist(upsert(state.watchlist, item))
    void notify('success')
    close()
    renderWatchlist(root)
    toast(existing ? 'Saved' : 'Added to your watchlist')
  })
}

async function exportCsv() {
  const csv = watchlistCsv(state.watchlist, state.suppliers, state.settings)
  const date = new Date().toISOString().slice(0, 10)
  await shareFile(`dropship-scout-watchlist-${date}.csv`, csv, 'text/csv', 'Watchlist CSV')
}
