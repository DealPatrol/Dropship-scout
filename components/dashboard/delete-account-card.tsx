'use client'

// Permanent account deletion (App Review Guideline 5.1.1(v)). Available on the
// web and inside the iOS app.

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isNativeIos, scoutKitUrl } from '@/lib/native/platform'

export function DeleteAccountCard() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ apple: boolean } | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Account deletion failed.')
      setDone({ apple: Boolean(data.appleSubscriptionLinked) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account deletion failed.')
    } finally {
      setBusy(false)
    }
  }

  async function manageAppleSubscription() {
    const { DropshipScoutNative } = await import('@/lib/native/native-plugin')
    await DropshipScoutNative.manageSubscriptions().catch(() => undefined)
  }

  if (done) {
    const native = isNativeIos()
    return (
      <Card id="delete-account" className="border-destructive/40">
        <CardHeader className="pb-3"><CardTitle className="text-base">Your account was deleted</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>Your account and its data were permanently removed. You have been signed out.</p>
          {done.apple && (
            <p>
              App Store subscriptions are billed by Apple. To stop future charges, cancel Dropship Scout Pro in Settings › Apple ID › Subscriptions.
              {native && <> <button type="button" className="text-primary underline" onClick={() => void manageAppleSubscription()}>Open subscriptions</button></>}
            </p>
          )}
          <Button className="self-start" onClick={() => { window.location.href = native ? scoutKitUrl('watchlist') : '/' }}>Done</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="delete-account" className="border-destructive/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          Delete account
        </CardTitle>
        <CardDescription>
          Permanently deletes your account, saved products, catalogs, launch workspaces, hosted store, listings, order history and connected channel credentials. An active Pro subscription billed on the web is cancelled. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!open ? (
          <Button variant="outline" className="border-destructive/50 text-destructive" onClick={() => setOpen(true)}>Delete my account…</Button>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delete-password">Password</Label>
              <Input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
              <Input id="delete-confirm" value={confirm} onChange={e => setConfirm(e.target.value)} autoCapitalize="characters" autoComplete="off" required />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || confirm !== 'DELETE' || !password} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Permanently delete
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(null) }}>Cancel</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
