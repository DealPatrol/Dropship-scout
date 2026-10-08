import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Sign in',
  description: 'Sign in to Dropship Scout to continue research or Pro checkout.',
  path: '/auth/login',
  noIndex: true,
})

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  )
}
