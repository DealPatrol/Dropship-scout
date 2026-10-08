'use client'

import { useEffect } from 'react'
import { attributionCookieName, attributionFromCookieValue, attributionFromSearch, mergeAttribution } from '@/lib/attribution'

export function AttributionCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const landing = `${window.location.pathname}${window.location.search}`.slice(0, 120)
    const incoming = attributionFromSearch(params, landing)
    if (!incoming) return
    const current = document.cookie
      .split('; ')
      .map(part => {
        const index = part.indexOf('=')
        return index === -1 ? null : [part.slice(0, index), part.slice(index + 1)] as const
      })
      .find(part => part?.[0] === attributionCookieName())
    const merged = mergeAttribution(attributionFromCookieValue(current?.[1]), incoming)
    if (!merged) return
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${attributionCookieName()}=${encodeURIComponent(JSON.stringify(merged))}; Path=/; Max-Age=7776000; SameSite=Lax${secure}`
  }, [])

  return null
}
