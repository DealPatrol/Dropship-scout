'use client'

// iOS app only: copies a product into the offline Scout Kit watchlist (stored on
// the device with Capacitor Preferences) so it can be reviewed in airplane mode.

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isNativeIos } from '@/lib/native/platform'
import { STORAGE_KEYS, newId, normalizeWatchItem, parseList, upsert, type WatchItem } from '@/lib/native/scout-kit'

export interface ScoutKitProduct {
  name: string
  category: string
  sellPrice: number
  supplierCost: number
  shippingDays?: number
  tags?: string[]
  notes?: string
}

export function SaveToScoutKitButton({ product }: { product: ScoutKitProduct }) {
  const [native, setNative] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => setNative(isNativeIos()), [])
  if (!native) return null

  async function save() {
    const device = await import('@/lib/native/device')
    const list = parseList(await device.readKey(STORAGE_KEYS.watchlist), raw => normalizeWatchItem(raw))
    const existing = list.find(item => item.name.toLowerCase() === product.name.toLowerCase())
    const now = new Date().toISOString()
    const item = normalizeWatchItem({
      ...(existing ?? {}),
      id: existing?.id ?? newId(),
      name: product.name,
      category: product.category,
      status: existing?.status ?? 'idea',
      sellPrice: product.sellPrice,
      supplierCost: product.supplierCost,
      tags: product.tags ?? [],
      notes: existing?.notes || [product.notes, product.shippingDays ? `Typical shipping: ${product.shippingDays} days.` : ''].filter(Boolean).join('\n'),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }) as WatchItem
    await device.writeKey(STORAGE_KEYS.watchlist, JSON.stringify(upsert(list, item)))
    await device.notify('success')
    setSaved(true)
  }

  return (
    <Button variant="outline" className="gap-2" onClick={() => void save()} disabled={saved}>
      <WifiOff className="h-4 w-4" />
      {saved ? 'Saved to Scout Kit' : 'Save to Scout Kit'}
    </Button>
  )
}
