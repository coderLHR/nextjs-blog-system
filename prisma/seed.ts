import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('demo123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashed,
      role: 'admin',
    },
  })

  const posts = [
    {
      title: 'Next.js 15 新特性详解',
      slug: 'nextjs-15-features',
      content: `# Next.js 15 新特性

## 1. React 19 支持
Next.js 15 全面支持 React 19，包括：
- React Server Components
- Server Actions
- useOptimistic、useActionState 等新 Hooks

## 2. 缓存策略更新
默认不再缓存 fetch 请求和路由处理器，开发者需要显式选择缓存策略：
\`\`\`ts
// 显式缓存
fetch(url, { next: { revalidate: 3600 } })
\`\`\`

## 3. Turbopack 稳定
开发服务器速度提升最高 53%，热更新更快。`,
      excerpt: 'Next.js 15 带来了 React 19 支持、缓存策略更新和 Turbopack 稳定版。',
      published: true,
      featured: true,
    },
    {
      title: 'Server Components 最佳实践',
      slug: 'server-components-best-practices',
      content: `# Server Components 最佳实践

## 什么是 Server Components？
React Server Components (RSC) 允许组件在服务端渲染，直接访问数据库和文件系统。

## 使用场景
- 数据获取
- 访问后端资源
- 渲染静态内容

## 注意事项
- 不能使用 useState、useEffect
- 不能访问浏览器 API
- 可以导入 Client Components`,
      excerpt: '掌握 React Server Components 的核心概念和最佳实践。',
      published: true,
      featured: false,
    },
    {
      title: 'App Router 路由深度解析',
      slug: 'app-router-deep-dive',
      content: `# App Router 深度解析

## 文件系统路由
App Router 使用文件夹定义路由：
- page.tsx — 路由页面
- layout.tsx — 共享布局
- loading.tsx — 加载状态
- error.tsx — 错误处理

## 动态路由
\`\`\`ts
// app/blog/[slug]/page.tsx
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>
}
\`\`\``,
      excerpt: '深入理解 Next.js App Router 的路由系统和高级特性。',
      published: true,
      featured: false,
    },
  ]

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: { ...post, authorId: user.id },
    })
  }

  console.log('✅ Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
