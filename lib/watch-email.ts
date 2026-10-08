const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const WATCH_SOURCES = ['idea-checker', 'research', 'pricing', 'footer', 'products-to-watch'] as const

export type WatchSource = (typeof WATCH_SOURCES)[number]

export function normalizeWatchEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (email.length < 3 || email.length > 254 || !EMAIL.test(email)) return null
  return email
}

function isWatchSource(value: string): value is WatchSource {
  return (WATCH_SOURCES as readonly string[]).includes(value)
}

export function watchSource(value: unknown): WatchSource {
  if (typeof value === 'string' && isWatchSource(value)) return value
  return 'products-to-watch'
}

/** Buyer-facing list failure. Does not include env var names. */
export function publicWatchError(err: unknown): { message: string; status: number } {
  const message = err instanceof Error ? err.message : 'Could not save that email'
  if (message.startsWith('Missing required environment variable:')) {
    return {
      message: 'The products-to-watch list is not available on this deployment yet.',
      status: 503,
    }
  }
  return { message: 'Could not save that email. Try again.', status: 500 }
}
