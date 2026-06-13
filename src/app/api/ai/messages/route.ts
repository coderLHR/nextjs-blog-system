import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const sessionId = Number(searchParams.get('sessionId'))
    if (!sessionId) return NextResponse.json({ error: '缺少会话 ID' }, { status: 400 })

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    })
    if (!chatSession || chatSession.userId !== session.id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    })

    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 })
  }
}
