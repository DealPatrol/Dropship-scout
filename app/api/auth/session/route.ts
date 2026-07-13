import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

// GET /api/auth/session
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ session: null })
  }

  return NextResponse.json({
    session: {
      user: session.user,
    },
  })
}
