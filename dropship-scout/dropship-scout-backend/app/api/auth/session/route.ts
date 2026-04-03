// app/api/auth/session/route.ts
// Restores user's last search session when they re-open the app

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/auth/session?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ session: null })

  const { data } = await supabaseAdmin
    .from('search_sessions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return NextResponse.json({ session: null })

  return NextResponse.json({
    session: {
      platforms: data.platforms,
      category: data.category,
      sortBy: data.sort_by,
      customNiche: data.custom_niche,
      results: data.results,
      searchedAt: data.searched_at,
    }
  })
}
