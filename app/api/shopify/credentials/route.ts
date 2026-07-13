import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'Shopify integration coming soon' },
    { status: 501 }
  )
}

export async function GET() {
  return NextResponse.json({ domain: null })
}
