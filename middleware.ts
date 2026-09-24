// middleware.ts
// Session-cookie auth checks + security headers + CORS

import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const user = token ? await verifySessionToken(token) : null
  const { pathname } = req.nextUrl

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/sign-up'))) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  const res = NextResponse.next()

  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CORS for API routes
  if (pathname.startsWith('/api/')) {
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || '*'
    res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: res.headers })
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
