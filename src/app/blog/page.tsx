import Link from 'next/link'
import { getPosts } from '@/lib/actions'
import { getSession } from '@/lib/session'
import { ArrowRight, PenLine, Eye } from 'lucide-react'
import Image from 'next/image'

export default async function BlogPage() {
  const posts = await getPosts({ published: true, limit: 50 })
  const session = await getSession()

  return (
    <div className="container py-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">博客文章</h1>
          <p className="text-muted-foreground mt-2 text-sm">探索 Next.js 全栈开发的最佳实践</p>
        </div>
        {session && (
          <Link
            href="/blog/new"
            className="ios-btn ios-btn-primary"
          >
            <PenLine className="h-4 w-4" />
            写文章
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="ios-card ios-card-press flex flex-col overflow-hidden group"
          >
            {post.coverImage ? (
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <span className="text-4xl opacity-20">📝</span>
              </div>
            )}
            <div className="flex flex-col flex-1 p-6">
              <Link href={`/blog/${post.slug}`} className="group/title">
                <h2 className="text-lg font-semibold tracking-tight group-hover/title:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>
              </Link>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2 flex-1 leading-relaxed">
                {post.excerpt}
              </p>
              <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{post.author?.name || post.author?.email}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.views}
                  </span>
                  <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
