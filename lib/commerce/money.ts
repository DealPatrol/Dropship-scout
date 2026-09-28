import { stripeFeeConfig } from './modes'

export function isCents(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

export function dollarsToCents(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount * 100)
}

export function formatCents(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export function estimateStripeFeeCents(grossCents: number): number {
  const { bps, fixedCents } = stripeFeeConfig()
  return Math.round((grossCents * bps) / 10_000) + fixedCents
}

export function slugify(value: string, max = 40): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max)
    .replace(/-$/g, '')
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isSlug(value: string): boolean {
  return value.length >= 3 && value.length <= 40 && SLUG.test(value)
}
