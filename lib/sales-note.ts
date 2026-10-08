/** Hide numeric sales claims. The app does not receive verified order volume. */
export function publicSalesNote(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed || /^not verified$/i.test(trimmed)) return 'Not verified'
  if (/^[\d.,]+\s*k$/i.test(trimmed)) return 'Not verified'
  if (/^\d[\d,]*(\.\d+)?$/.test(trimmed)) return 'Not verified'
  if (/\d/.test(trimmed) && /\b(orders|sales|sold|revenue|units)\b/i.test(trimmed)) return 'Not verified'
  return trimmed
}
