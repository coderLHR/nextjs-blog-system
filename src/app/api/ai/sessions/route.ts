import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, deepThinking: true, createdAt: true },
    })

    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json({ error: '获取会话列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = await request.json()
    const newSession = await prisma.chatSession.create({
      data: {
        userId: session.id,
        title: body.title || '新对话',
        deepThinking: body.deepThinking ?? false,
      },
    })

    return NextResponse.json(newSession)
  } catch {
    return NextResponse.json({ error: '创建会话失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) return NextResponse.json({ error: '缺少会话 ID' }, { status: 400 })

    await prisma.chatSession.delete({
      where: { id, userId: session.id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除会话失败' }, { status: 500 })
  }
}
