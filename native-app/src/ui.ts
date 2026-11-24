// Minimal DOM helpers for the Scout Kit (no framework, small bundle).

type Child = Node | string | number | null | undefined | false
type Attrs = Record<string, unknown>

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: (Child | Child[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue
    if (key === 'class') el.className = String(value)
    else if (key === 'dataset' && typeof value === 'object') Object.assign(el.dataset, value)
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value as EventListener)
    else if (key === 'value' && 'value' in el) (el as HTMLInputElement).value = String(value)
    else if (key === 'checked' && 'checked' in el) (el as HTMLInputElement).checked = Boolean(value)
    else if (value === true) el.setAttribute(key, '')
    else el.setAttribute(key, String(value))
  }
  append(el, children)
  return el
}

function append(el: Node, children: (Child | Child[])[]) {
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    el.appendChild(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(String(child)) : child)
  }
}

export function clear(el: Element) {
  while (el.firstChild) el.removeChild(el.firstChild)
}

let toastTimer: number | undefined
export function toast(message: string) {
  let el = document.getElementById('toast')
  if (!el) {
    el = h('div', { id: 'toast', role: 'status', class: 'toast' })
    document.body.appendChild(el)
  }
  el.textContent = message
  el.classList.add('show')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => el?.classList.remove('show'), 2600)
}

/** Bottom sheet. Returns a close function. */
export function sheet(title: string, body: Node, opts: { onClose?: () => void } = {}): () => void {
  const backdrop = h('div', { class: 'sheet-backdrop' })
  const close = () => {
    backdrop.remove()
    document.body.classList.remove('sheet-open')
    opts.onClose?.()
  }
  const panel = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-head' },
      h('h2', {}, title),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: close }, '✕'),
    ),
    h('div', { class: 'sheet-body' }, body),
  )
  backdrop.addEventListener('click', event => { if (event.target === backdrop) close() })
  backdrop.appendChild(panel)
  document.body.appendChild(backdrop)
  document.body.classList.add('sheet-open')
  return close
}

export function field(label: string, input: HTMLElement, hint?: string): HTMLElement {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), input, hint ? h('span', { class: 'field-hint' }, hint) : null)
}

export function textInput(name: string, value: string, attrs: Attrs = {}): HTMLInputElement {
  return h('input', { name, value, type: 'text', autocomplete: 'off', ...attrs })
}

export function moneyInput(name: string, value: number | string | null, attrs: Attrs = {}): HTMLInputElement {
  return h('input', { name, value: value ?? '', type: 'text', inputmode: 'decimal', placeholder: '0.00', autocomplete: 'off', ...attrs })
}

export function select(name: string, options: readonly string[], value: string, labels: Record<string, string> = {}): HTMLSelectElement {
  const el = h('select', { name }, options.map(opt => h('option', { value: opt }, labels[opt] ?? opt)))
  el.value = value
  return el
}

export function toggle(label: string, checked: boolean, onChange: (checked: boolean, input: HTMLInputElement) => void, hint?: string): HTMLElement {
  const input = h('input', { type: 'checkbox', role: 'switch', checked })
  input.addEventListener('change', () => onChange(input.checked, input))
  return h('label', { class: 'toggle-row' }, h('span', {}, h('span', { class: 'toggle-label' }, label), hint ? h('span', { class: 'field-hint' }, hint) : null), input)
}

export function formValues(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {}
  new FormData(form).forEach((value, key) => { out[key] = typeof value === 'string' ? value : '' })
  return out
}

export function confirmAction(message: string): boolean {
  return window.confirm(message)
}
