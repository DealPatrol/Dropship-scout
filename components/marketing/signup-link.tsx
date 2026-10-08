'use client'

import Link from 'next/link'
import { track } from '@vercel/analytics'

export function SignupLink({
  href,
  location,
  className,
  children,
}: {
  href: string
  location: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        try {
          track('signup-click', { location })
        } catch {
          // Analytics must not block the signup path.
        }
      }}
    >
      {children}
    </Link>
  )
}
