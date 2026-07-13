import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'Shopify push integration coming soon' },
    { status: 501 }
  )
}
