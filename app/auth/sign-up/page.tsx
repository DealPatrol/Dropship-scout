import { Suspense } from 'react'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Sign up',
  description: 'Create a free Dropship Scout account. Choose Pro at signup to continue into Stripe Checkout.',
  path: '/auth/sign-up',
  noIndex: true,
})

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignUpForm />
    </Suspense>
  )
}
