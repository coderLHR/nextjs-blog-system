import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany()
    const map: Record<string, string> = {}
    for (const c of configs) {
      map[c.key] = c.value
    }
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const entries = Object.entries(body) as [string, string][]

    for (const [key, value] of entries) {
      await prisma.siteConfig.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '保存配置失败' }, { status: 500 })
  }
}
