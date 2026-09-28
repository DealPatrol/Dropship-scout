export interface CartLine {
  listingId: string
  quantity: number
  title: string
  priceCents: number
  shippingCents: number
  imageUrl?: string
}

function key(slug: string): string {
  return `ds-cart:${slug}`
}

export function readCart(slug: string): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key(slug)) || '[]') as CartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCart(slug: string, lines: CartLine[]): void {
  window.localStorage.setItem(key(slug), JSON.stringify(lines))
}

export function addToCart(slug: string, line: CartLine): CartLine[] {
  const current = readCart(slug)
  const existing = current.find(item => item.listingId === line.listingId)
  const next = existing
    ? current.map(item => item.listingId === line.listingId
      ? { ...item, quantity: Math.min(item.quantity + line.quantity, 20) }
      : item)
    : [...current, line]
  writeCart(slug, next)
  return next
}

export function clearCart(slug: string): void {
  window.localStorage.removeItem(key(slug))
}
