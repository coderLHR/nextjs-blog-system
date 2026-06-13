import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [postCount, totalViews, userCount] = await Promise.all([
      prisma.post.count({ where: { published: true } }),
      prisma.post.aggregate({ _sum: { views: true } }),
      prisma.user.count(),
    ])

    return NextResponse.json({
      postCount,
      totalViews: totalViews._sum.views ?? 0,
      userCount,
    })
  } catch {
    return NextResponse.json({ postCount: 0, totalViews: 0, userCount: 0 })
  }
}
