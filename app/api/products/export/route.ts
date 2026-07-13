import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ message: 'Export feature coming soon' }, { status: 501 })
}
