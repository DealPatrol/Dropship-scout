import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'Real product search integration coming soon' },
    { status: 501 }
  )
}
