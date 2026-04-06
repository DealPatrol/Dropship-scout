// app/api/products/search/route.ts
// Handles AI product search. Keeps Anthropic API key server-side.

import { NextRequest, NextResponse } from 'next/server'
import { generateProducts } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { platforms, category, sortBy, customNiche, userId } = await req.json()

    if (!platforms?.length) {
      return NextResponse.json({ error: 'Select at least one platform' }, { status: 400 })
    }

    const products = await generateProducts({ platforms, category, sortBy, customNiche, userId })

    // If user is logged in, save the search session to DB
    if (userId) {
      await supabaseAdmin
        .from('search_sessions')
        .upsert(
          {
            user_id: userId,
            platforms,
            category,
            sort_by: sortBy,
            custom_niche: customNiche,
            results: products,
            searched_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
    }

    return NextResponse.json({ products })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed'
    console.error('Search error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
