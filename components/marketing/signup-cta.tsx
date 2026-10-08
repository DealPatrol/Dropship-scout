import { SignupLink } from '@/components/marketing/signup-link'
import { Button } from '@/components/ui/button'

export function SignupCta({
  location,
  heading = 'Start with a free account',
  body = 'Save products while you check supplier quotes. When you want the research caps removed, the same signup continues into Stripe Checkout for Pro.',
}: {
  location: string
  heading?: string
  body?: string
}) {
  return (
    <aside className="mt-12 rounded-xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <SignupLink href="/auth/sign-up" location={location}>
          <Button>Create a free account</Button>
        </SignupLink>
        <SignupLink href="/auth/sign-up?plan=pro" location={`${location}-pro`}>
          <Button variant="outline">Continue to Pro checkout</Button>
        </SignupLink>
      </div>
    </aside>
  )
}
