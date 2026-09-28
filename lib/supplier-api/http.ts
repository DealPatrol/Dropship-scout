export type FetchImpl = typeof fetch

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export async function supplierFetch(
  fetchImpl: FetchImpl,
  url: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await fetchImpl(url, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const body = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, body }
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
