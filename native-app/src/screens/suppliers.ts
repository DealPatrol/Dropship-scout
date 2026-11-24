import { notify, shareText } from '@/lib/native/device'
import { SUPPLIER_PLATFORMS, newId, normalizeSupplier, removeById, supplierBrief, upsert, type SupplierNote } from '@/lib/native/scout-kit'
import { saveSuppliers, saveWatchlist, state } from '../state'
import { clear, confirmAction, field, formValues, h, select, sheet, textInput, toast } from '../ui'

export function renderSuppliers(root: HTMLElement, openId?: string) {
  clear(root)
  const list = h('div', { class: 'list' })
  root.append(
    h('header', { class: 'screen-head' }, h('div', {}, h('h1', {}, 'Suppliers'), h('p', { class: 'muted' }, 'Quotes, shipping times and contacts for the suppliers you are vetting. Stored on this iPhone.'))),
    h('div', { class: 'toolbar' }, h('button', { class: 'btn primary', type: 'button', onclick: () => editSupplier(null, root) }, '+ Add supplier')),
    list,
  )
  if (state.suppliers.length === 0) {
    list.append(h('div', { class: 'empty' },
      h('p', { class: 'empty-title' }, 'No supplier notes yet'),
      h('p', { class: 'muted' }, 'Record each supplier’s shipping time, minimum order and your experience, then link them to watchlist products and share a supplier brief.'),
    ))
  }
  for (const supplier of state.suppliers) {
    const linked = state.watchlist.filter(i => i.supplierId === supplier.id).length
    list.append(h('button', { type: 'button', class: 'card item-card', onclick: () => showSupplier(supplier, root) },
      h('div', { class: 'row space' }, h('span', { class: 'item-name' }, supplier.name), h('span', { class: 'badge' }, supplier.platform)),
      h('div', { class: 'row metrics' },
        supplier.rating ? h('span', { 'aria-label': `${supplier.rating} of 5` }, '★'.repeat(supplier.rating) + '☆'.repeat(5 - supplier.rating)) : null,
        supplier.shippingDays ? h('span', {}, `Ships ${supplier.shippingDays}`) : null,
        h('span', { class: 'muted' }, `${linked} product${linked === 1 ? '' : 's'}`),
      ),
    ))
  }
  if (openId) {
    const s = state.suppliers.find(x => x.id === openId)
    if (s) showSupplier(s, root)
  }
}

function showSupplier(supplier: SupplierNote, root: HTMLElement) {
  let close = () => {}
  const body = h('div', { class: 'stack' },
    h('pre', { class: 'brief' }, supplierBrief(supplier, state.watchlist)),
    h('div', { class: 'toolbar' },
      h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        if ((await shareText(`Supplier brief: ${supplier.name}`, supplierBrief(supplier, state.watchlist))) === 'copied') toast('Copied to the clipboard')
      } }, 'Share supplier brief'),
      h('button', { class: 'btn', type: 'button', onclick: () => { close(); editSupplier(supplier, root) } }, 'Edit'),
      h('button', { class: 'btn danger', type: 'button', onclick: async () => {
        if (!confirmAction(`Delete supplier “${supplier.name}”? Linked products stay on your watchlist.`)) return
        await saveSuppliers(removeById(state.suppliers, supplier.id))
        await saveWatchlist(state.watchlist.map(i => (i.supplierId === supplier.id ? { ...i, supplierId: null } : i)))
        void notify('warning')
        close()
        renderSuppliers(root)
      } }, 'Delete'),
    ),
  )
  close = sheet(supplier.name, body)
}

function editSupplier(existing: SupplierNote | null, root: HTMLElement) {
  const rating = select('rating', ['0', '1', '2', '3', '4', '5'], String(existing?.rating ?? 0), { 0: 'Not rated', 1: '★', 2: '★★', 3: '★★★', 4: '★★★★', 5: '★★★★★' })
  const form = h('form', { class: 'stack', novalidate: true },
    field('Supplier name', textInput('name', existing?.name ?? '', { required: true, maxlength: 140 })),
    field('Platform', select('platform', SUPPLIER_PLATFORMS, existing?.platform ?? 'CJ Dropshipping')),
    h('div', { class: 'grid2' },
      field('Shipping time', textInput('shippingDays', existing?.shippingDays ?? '', { placeholder: 'e.g. 7–12 days' })),
      field('Minimum order', textInput('moq', existing?.moq ?? '', { placeholder: 'e.g. 1 unit' })),
    ),
    field('Rating', rating),
    field('Contact', textInput('contact', existing?.contact ?? '', { placeholder: 'Agent name, email or WhatsApp' })),
    field('Link', textInput('url', existing?.url ?? '', { type: 'url', inputmode: 'url', placeholder: 'https://' })),
    field('Notes', h('textarea', { name: 'notes', rows: 4, maxlength: 4000 }, existing?.notes ?? '')),
    h('p', { class: 'error', role: 'alert' }),
    h('button', { class: 'btn primary block', type: 'submit' }, existing ? 'Save changes' : 'Add supplier'),
  )
  const close = sheet(existing ? 'Edit supplier' : 'Add supplier', form)
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const v = formValues(form)
    const now = new Date().toISOString()
    const supplier = normalizeSupplier({ ...v, rating: Number(v.rating), id: existing?.id ?? newId(), createdAt: existing?.createdAt ?? now, updatedAt: now })
    if (!supplier) {
      (form.querySelector('.error') as HTMLElement).textContent = 'Enter a supplier name.'
      void notify('error')
      return
    }
    await saveSuppliers(upsert(state.suppliers, supplier))
    void notify('success')
    close()
    renderSuppliers(root)
  })
}
