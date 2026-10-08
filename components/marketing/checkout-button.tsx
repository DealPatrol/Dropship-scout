'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { startProCheckout } from '@/components/billing/start-checkout'
import { Button } from '@/components/ui/button'
import type { BillingInterval } from '@/lib/billing'

export function CheckoutButton({
  source,
  interval = 'month',
  children,
  variant = 'default',
}: {
  source: string
  interval?: BillingInterval
  children: React.ReactNode
  variant?: 'default' | 'outline'
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setLoading(true)
    setError(null)
    try {
      const url = await startProCheckout(source, interval)
      window.location.assign(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={onClick} disabled={loading} variant={variant}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Opening checkout…' : children}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
