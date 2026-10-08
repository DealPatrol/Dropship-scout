'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Radar } from 'lucide-react'
import { startProCheckout } from '@/components/billing/start-checkout'
import { SignupLink } from '@/components/marketing/signup-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { safeNextPath } from '@/lib/paths'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const plan = params.get('plan') === 'pro' ? 'pro' : null
  const next = safeNextPath(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signUpHref = plan === 'pro'
    ? '/auth/sign-up?plan=pro'
    : next
      ? `/auth/sign-up?next=${encodeURIComponent(next)}`
      : '/auth/sign-up'

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
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
        const url = await startProCheckout('login')
        window.location.assign(url)
        return
      } catch (err) {
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
            <CardTitle className="text-xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              {plan === 'pro' ? 'Sign in to continue to Pro checkout.' : 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" aria-describedby={error ? 'login-error' : undefined} className={error ? 'border-destructive focus:ring-destructive' : ''} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" className={error ? 'border-destructive focus:ring-destructive' : ''} />
              </div>
              {error && <p id="login-error" role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full mt-1">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : plan === 'pro' ? 'Sign in and continue' : 'Sign in'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <SignupLink href={signUpHref} location="login-to-sign-up" className="text-primary hover:underline font-medium">
                Sign up free
              </SignupLink>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
