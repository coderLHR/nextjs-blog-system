import Link from 'next/link'
import Image from 'next/image'
import { getPosts, getStats, getSiteConfig } from '@/lib/actions'
import { getSession } from '@/lib/session'
import { ArrowRight, BookOpen } from 'lucide-react'
import { HeroSection } from '@/components/home/HeroSection'

const DEFAULT_BG = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80'

export default async function Home() {
  let posts: Awaited<ReturnType<typeof getPosts>> = []
  let stats: Awaited<ReturnType<typeof getStats>> = { postCount: 0, totalViews: 0, userCount: 0 }
  let siteConfig: Awaited<ReturnType<typeof getSiteConfig>> = {}
  let session: Awaited<ReturnType<typeof getSession>> = null

  try {
    [posts, stats, siteConfig, session] = await Promise.all([
      getPosts({ published: true, limit: 6 }),
      getStats(),
      getSiteConfig(),
      getSession(),
    ])
  } catch {
    // graceful fallback
  }

  const bgImage = siteConfig.heroBackground || DEFAULT_BG

  return (
    <>
      {/* Background */}
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Hero Section - break out of container */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <HeroSection stats={stats} />
      </div>

      {/* Latest Posts Section */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl font-bold tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
            >
              最新文章
            </h2>
            <Link
              href="/blog"
              className="ios-btn ios-btn-secondary text-sm"
            >
              查看全部
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(0, 6).map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl overflow-hidden bg-[rgba(20,20,28,0.6)] border border-[rgba(255,255,255,0.06)] backdrop-blur-md transition-all duration-300 hover:border-[rgba(0,212,255,0.15)] hover:shadow-[0_0_30px_rgba(0,212,255,0.06)]"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.8)] to-transparent" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold tracking-tight text-foreground group-hover:text-[var(--neon-blue)] transition-colors mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.author?.name || post.author?.email}</span>
                    <span className="opacity-40">·</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                    <span className="opacity-40">·</span>
                    <span>{post.views} 阅读</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/blog', label: '浏览博客', icon: BookOpen, desc: '所有技术文章' },
              { href: '/learn', label: '学习路径', icon: BookOpen, desc: 'Next.js 教学模块' },
              { href: '/ai-chat', label: 'AI 对话', icon: BookOpen, desc: '智能问答助手' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 p-5 rounded-xl bg-[rgba(20,20,28,0.4)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(0,212,255,0.12)] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.08)] flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-[var(--neon-blue)]" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground group-hover:text-[var(--neon-blue)] transition-colors">
                    {item.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          {/* Admin shortcut */}
          {session && (
            <div className="mt-8 p-6 rounded-2xl bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.08)] text-center">
              <p className="text-sm text-muted-foreground mb-3">
                欢迎回来，<span className="font-medium text-foreground">{session.name || session.email}</span>
              </p>
              <Link href="/blog/new" className="ios-btn ios-btn-primary">
                写文章
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
