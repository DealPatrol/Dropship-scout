'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Radar } from 'lucide-react'
import { startProCheckout } from '@/components/billing/start-checkout'
import { SignupLink } from '@/components/marketing/signup-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseBillingInterval, proAuthHref } from '@/lib/billing'
import { safeNextPath } from '@/lib/paths'
import { track } from '@vercel/analytics'

export function SignUpForm() {
  const router = useRouter()
  const params = useSearchParams()
  const plan = params.get('plan') === 'pro' ? 'pro' : null
  const interval = parseBillingInterval(params.get('interval'))
  const next = safeNextPath(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountCreated, setAccountCreated] = useState(false)

  const loginHref = plan === 'pro' ? proAuthHref('/auth/login', interval) : next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      track('signup-click', { location: 'sign-up-form' })
    } catch {
      // Analytics must not block account creation.
    }

    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Sign up failed')
        setLoading(false)
        return
      }
    } catch {
      setError('Could not reach the server. Try again.')
      setLoading(false)
      return
    }

    if (plan === 'pro') {
      try {
        const url = await startProCheckout('sign-up', interval)
        window.location.assign(url)
        return
      } catch (err) {
        setAccountCreated(true)
        setError(err instanceof Error ? err.message : 'Could not start checkout')
        setLoading(false)
        return
      }
    }

    router.push(next || '/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-30 pointer-events-none" />
      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Radar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">Dropship Scout</span>
        </div>
        <Card className="border-border bg-card/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              {plan === 'pro'
                ? interval === 'year'
                  ? 'After this form, Stripe Checkout opens for annual Pro billing.'
                  : 'After this form, Stripe Checkout opens for monthly Pro billing.'
                : 'Start a free research account. Upgrade later from pricing.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" className={error ? 'border-destructive' : ''} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={event => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" className={error ? 'border-destructive' : ''} />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              {accountCreated && (
                <p className="text-sm text-muted-foreground">
                  The account exists.{' '}
                  <Link href="/dashboard/settings" className="text-primary hover:underline">Open billing in Settings</Link>
                  {' '}to try checkout again.
                </p>
              )}
              <Button type="submit" disabled={loading || accountCreated} className="w-full mt-1">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : plan === 'pro' ? 'Create account and continue' : 'Create account'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <SignupLink href={loginHref} location="sign-up-to-login" className="text-primary hover:underline font-medium">
                Sign in
              </SignupLink>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
