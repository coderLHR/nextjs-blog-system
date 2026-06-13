import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { encryptKey, decryptKey } from '@/lib/crypto'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const config = await prisma.aiConfig.findUnique({ where: { userId: session.id } })
    if (!config) return NextResponse.json({ provider: '', apiEndpoint: '', apiKey: '' })

    const apiKey = decryptKey(config.encryptedApiKey, config.encryptionIV)
    const masked = apiKey.length > 8
      ? apiKey.slice(0, 4) + '•'.repeat(Math.min(apiKey.length - 8, 20)) + apiKey.slice(-4)
      : '••••••••'

    return NextResponse.json({
      provider: config.provider,
      apiEndpoint: config.apiEndpoint,
      apiKey: masked,
      hasKey: true,
    })
  } catch {
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = await request.json()
    const { provider, apiEndpoint, apiKey } = body

    if (!provider || !apiEndpoint || !apiKey) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const { encrypted, iv } = encryptKey(apiKey)

    await prisma.aiConfig.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        provider,
        apiEndpoint,
        encryptedApiKey: encrypted,
        encryptionIV: iv,
      },
      update: {
        provider,
        apiEndpoint,
        encryptedApiKey: encrypted,
        encryptionIV: iv,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '保存配置失败' }, { status: 500 })
  }
}
