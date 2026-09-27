// app/api/products/search/route.ts
// Handles AI product search. Keeps Anthropic API key server-side.

import { NextRequest, NextResponse } from 'next/server'
import { generateProducts } from '@/lib/ai'
import { upsertSearchSession } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platforms, category, sortBy, customNiche } = await req.json()

    if (!platforms?.length) {
      return NextResponse.json({ error: 'Select at least one platform' }, { status: 400 })
    }

    const products = await generateProducts({ platforms, category, sortBy, customNiche })

    await upsertSearchSession(user.id, {
      platforms,
      category,
      sortBy,
      customNiche,
      results: products,
    })

    return NextResponse.json({ products })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed'
    console.error('Search error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
