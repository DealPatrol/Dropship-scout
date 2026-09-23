// app/api/auth/session/route.ts
// Restores user's last search session when they re-open the app

import { NextResponse } from 'next/server'
import { getSearchSession } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/auth/session
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ session: null })

  const data = await getSearchSession(user.id).catch(() => null)

  if (!data) return NextResponse.json({ session: null })

  return NextResponse.json({
    session: {
      platforms: data.platforms,
      category: data.category,
      sortBy: data.sort_by,
      customNiche: data.custom_niche,
      results: data.results,
      searchedAt: data.searched_at,
    },
  })
}
