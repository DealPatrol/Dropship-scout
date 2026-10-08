'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { startProCheckout } from '@/components/billing/start-checkout'
import { Button } from '@/components/ui/button'
import { PRO_WAITLIST_SAVED, PRO_WAITLIST_UNSAVED, type BillingInterval } from '@/lib/billing'

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
  const [waitlist, setWaitlist] = useState<string | null>(null)

  async function onClick() {
    setLoading(true)
    setError(null)
    setWaitlist(null)
    try {
      const result = await startProCheckout(source, interval)
      if (result.waitlist) {
        setWaitlist(result.saved ? PRO_WAITLIST_SAVED : PRO_WAITLIST_UNSAVED)
        setLoading(false)
        return
      }
      window.location.assign(result.url)
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
      {waitlist && <p role="status" className="mt-2 text-sm text-muted-foreground">{waitlist}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
