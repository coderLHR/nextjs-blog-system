import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug, incrementViews } from '@/lib/actions'
import { getSession } from '@/lib/session'
import { ArrowLeft, Calendar, User, Eye, Edit, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'
import { deletePost } from '@/lib/actions'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: '文章未找到' }
  return {
    title: `${post.title} - NextBlog`,
    description: post.excerpt || undefined,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  // Increment views (fire and forget)
  incrementViews(slug)

  const session = await getSession()
  const canEdit = session && (session.id === post.authorId || session.role === 'admin')

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </Link>

      <article className="space-y-6">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author?.name || post.author?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.createdAt).toLocaleDateString('zh-CN')}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.views} 阅读
            </span>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Link
                href={`/blog/edit/${post.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm hover:bg-accent transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
                编辑
              </Link>
              <form action={deletePost.bind(null, post.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </button>
              </form>
            </div>
          )}
        </header>

        {post.coverImage && (
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <div className="prose dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
