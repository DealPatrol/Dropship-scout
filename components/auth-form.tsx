'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Radar } from 'lucide-react'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'sign-in') {
        await authClient.signIn.email({ email, password })
      } else {
        await authClient.signUp.email({ email, password, name })
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Radar className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-semibold text-foreground">Dropship Scout</span>
      </div>

      <Card className="border-border bg-card/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-center">
            {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'sign-in' ? 'Sign in to your account to continue' : 'Sign up to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'sign-up' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className={error ? 'border-destructive focus:ring-destructive' : ''}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-describedby={error ? 'auth-error' : undefined}
                className={error ? 'border-destructive focus:ring-destructive' : ''}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                className={error ? 'border-destructive focus:ring-destructive' : ''}
              />
            </div>

            {error && (
              <p id="auth-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'sign-in' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : mode === 'sign-in' ? (
                'Sign in'
              ) : (
                'Sign up'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'sign-in' ? (
              <>
                Don&apos;t have an account?{' '}
                <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                  Sign up free
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </>
  )
}
