import { NextResponse } from 'next/server'

// Module-level in-memory store (resets on server restart — fine for demo)
// In production, replace with database.
let configStore: unknown = null

export async function GET() {
  return NextResponse.json({ data: configStore })
}

export async function POST(req: Request) {
  try {
    configStore = await req.json()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
