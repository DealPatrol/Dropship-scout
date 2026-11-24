'use client'

// Pro upgrade inside the iOS app: StoreKit 2 auto-renewable subscriptions
// (App Review Guideline 3.1.1 / 3.1.2). No Stripe, no external payment links.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StoreProduct } from '@/lib/native/native-plugin'

interface Props {
  userId: string
  plan: 'free' | 'pro'
  source: 'apple' | 'stripe' | null
  appleExpiresAt: string | null
  onChanged: () => void
}

export function AppStoreProPanel({ userId, plan, source, appleExpiresAt, onChanged }: Props) {
  const [products, setProducts] = useState<StoreProduct[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    import('@/lib/native/iap')
      .then(({ loadProProducts }) => loadProProducts())
      .then(setProducts)
      .catch(() => {
        setProducts([])
        setError('The App Store is not reachable right now. Check your connection and try again.')
      })
  }, [])

  async function buy(product: StoreProduct) {
    setBusy(product.id)
    setError(null)
    setMessage(null)
    try {
      const [{ purchasePro }, device] = await Promise.all([import('@/lib/native/iap'), import('@/lib/native/device')])
      const result = await purchasePro(product.id, userId)
      if (result.status === 'purchased') {
        await device.notify('success')
        setMessage(result.sync?.plan === 'pro' ? 'Pro is active. Thank you!' : 'Purchase received. Pro will activate shortly.')
        onChanged()
      } else if (result.status === 'pending') {
        setMessage('The purchase is waiting for approval (for example Ask to Buy). Pro activates once it is approved.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The purchase did not complete.')
    } finally {
      setBusy(null)
    }
  }

  async function restore() {
    setBusy('restore')
    setError(null)
    setMessage(null)
    try {
      const { restorePro } = await import('@/lib/native/iap')
      const result = await restorePro()
      if (!result) setMessage('No App Store subscription was found for this Apple ID.')
      else {
        setMessage(result.plan === 'pro' ? 'Your App Store subscription was restored.' : 'Your App Store subscription has ended.')
        onChanged()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed.')
    } finally {
      setBusy(null)
    }
  }

  async function manage() {
    const { DropshipScoutNative } = await import('@/lib/native/native-plugin')
    await DropshipScoutNative.manageSubscriptions().catch(() => setError('Open Settings › Apple ID › Subscriptions to manage it.'))
  }

  if (plan === 'pro' && source === 'stripe') {
    // A subscription bought on the website: honor it, but never link out to web billing from the app.
    return <p className="text-sm text-muted-foreground">Pro is active on this account.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {plan === 'pro' ? (
        <>
          <p className="text-sm">
            Pro is active through the App Store{appleExpiresAt ? ` and renews ${new Date(appleExpiresAt).toLocaleDateString()}` : ''}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void manage()}>Manage subscription</Button>
            <Button variant="ghost" disabled={busy !== null} onClick={() => void restore()}>Restore purchases</Button>
          </div>
        </>
      ) : (
        <>
          {products === null && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading App Store prices…</p>}
          {products?.map(product => (
            <div key={product.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{product.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {product.displayPrice} per {product.period ?? (product.id.endsWith('yearly') ? 'year' : 'month')}, auto-renews until cancelled
                  {product.introOffer ? ` · ${product.introOffer}` : ''}
                </p>
              </div>
              <Button disabled={busy !== null} onClick={() => void buy(product)}>
                {busy === product.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Subscribe
              </Button>
            </div>
          ))}
          <Button variant="ghost" className="self-start" disabled={busy !== null} onClick={() => void restore()}>
            {busy === 'restore' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Restore purchases
          </Button>
          <p className="text-xs text-muted-foreground">
            Payment is charged to your Apple ID at confirmation. The subscription renews automatically unless it is cancelled at least 24 hours before the end of the current period. Manage or cancel it in your Apple ID settings.{' '}
            <Link href="/terms" className="underline">Terms of Use</Link> ·{' '}
            <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" className="underline">Apple EULA</a> ·{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </>
      )}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
