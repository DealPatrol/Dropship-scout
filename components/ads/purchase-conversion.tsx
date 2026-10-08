'use client'

import { useEffect } from 'react'
import { purchaseTagsEnabled } from '@/lib/ads-config'
import { trackAdsConversion, type PurchaseConversion } from '@/lib/ads-events'

export function PurchaseConversion() {
  useEffect(() => {
    if (!purchaseTagsEnabled()) return
    async function claim() {
      const response = await fetch('/api/billing/conversion', { method: 'POST' })
      if (!response.ok) return
      const data = await response.json().catch(() => ({}))
      if (!data.claimed || typeof data.transactionId !== 'string') return
      const purchase: PurchaseConversion = {
        transactionId: data.transactionId,
        valueCents: typeof data.valueCents === 'number' ? data.valueCents : null,
        currency: typeof data.currency === 'string' ? data.currency : null,
      }
      trackAdsConversion('purchase', purchase)
    }
    void claim()
  }, [])

  return null
}
