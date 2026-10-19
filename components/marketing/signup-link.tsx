'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { hrefWithOrigin } from '@/lib/analytics/origin'
import { FUNNEL, rememberOrigin, trackFunnel } from '@/lib/analytics/track-funnel'

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
  const [dest, setDest] = useState(href)
  useEffect(() => {
    setDest(hrefWithOrigin(href, window.location.pathname))
  }, [href])

  return (
    <Link
      href={dest}
      className={className}
      onClick={() => {
        const path = window.location.pathname
        rememberOrigin(path)
        trackFunnel(FUNNEL.ctaClicked, { cta: location, path })
        trackFunnel(FUNNEL.signupClick, { location, path })
      }}
    >
      {children}
    </Link>
  )
}
