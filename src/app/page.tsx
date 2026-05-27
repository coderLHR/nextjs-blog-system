import Link from 'next/link'
import { getPosts } from '@/lib/actions'
import { getSession } from '@/lib/session'
import { ArrowRight, BookOpen, Zap, Shield, Code } from 'lucide-react'
import Image from 'next/image'

export default async function Home() {
  let posts: Awaited<ReturnType<typeof getPosts>> = []
  let session: Awaited<ReturnType<typeof getSession>> = null

  try {
    posts = await getPosts({ published: true, limit: 3 })
  } catch {
    posts = []
  }

  try {
    session = await getSession()
  } catch {
    session = null
  }

  return (
    <div className="container py-10 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-8 max-w-3xl mx-auto pt-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          Next.js <span className="text-primary">全栈博客</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          基于 Next.js 15 App Router + React 19 Server Components + Prisma + Tailwind CSS 构建。
          包含完整的 Next.js 教学模块与最佳实践。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/blog"
            className="ios-btn ios-btn-primary px-7 py-3.5 text-base"
          >
            浏览博客
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/learn"
            className="ios-btn ios-btn-secondary px-7 py-3.5 text-base"
          >
            <BookOpen className="h-4 w-4" />
            学习 Next.js
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Zap className="h-7 w-7 text-amber-500" />,
            title: '性能优化',
            desc: 'ISR 增量静态再生、React Suspense Streaming、Image 自动优化、代码分割',
          },
          {
            icon: <Shield className="h-7 w-7 text-emerald-500" />,
            title: '全栈安全',
            desc: 'JWT Session 认证、Server Actions、Prisma ORM、输入验证、SQL 注入防护',
          },
          {
            icon: <Code className="h-7 w-7 text-blue-500" />,
            title: '现代架构',
            desc: 'App Router、Server Components、TypeScript、Tailwind CSS、暗黑模式',
          },
        ].map((f) => (
          <div
            key={f.title}
            className="ios-card ios-card-press p-7 flex flex-col"
          >
            <div className="mb-5 w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              {f.icon}
            </div>
            <h3 className="font-semibold text-lg tracking-tight mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Latest Posts */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="ios-section-title">最新文章</h2>
          <Link
            href="/blog"
            className="ios-btn ios-btn-secondary text-sm"
          >
            查看全部
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="ios-card ios-card-press block overflow-hidden group"
            >
              {post.coverImage && (
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{post.author?.name || post.author?.email}</span>
                  <span className="opacity-40">·</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Admin shortcut */}
      {session && (
        <section className="ios-card p-8 text-center space-y-4 bg-gradient-to-br from-primary/5 to-primary/[0.02]">
          <p className="text-sm text-muted-foreground">欢迎回来，<span className="font-medium text-foreground">{session.name || session.email}</span></p>
          <Link
            href="/blog/new"
            className="ios-btn ios-btn-primary"
          >
            <Code className="h-4 w-4" />
            写文章
          </Link>
        </section>
      )}
    </div>
  )
}
