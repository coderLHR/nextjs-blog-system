import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { updatePost } from '@/lib/actions'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const post = await prisma.post.findUnique({ where: { id: Number(id) } })
  if (!post) notFound()

  if (post.authorId !== session.id && session.role !== 'admin') {
    redirect('/blog')
  }

  const updatePostWithId = updatePost.bind(null, post.id)

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回文章
      </Link>

      <h1 className="text-2xl font-bold mb-6">编辑文章</h1>

      <form action={updatePostWithId} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">标题</label>
          <input
            name="title"
            defaultValue={post.title}
            required
            className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">摘要</label>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={post.excerpt || ''}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">正文（支持 Markdown）</label>
          <textarea
            name="content"
            required
            rows={16}
            defaultValue={post.content}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            name="published"
            type="checkbox"
            defaultChecked={post.published}
            id="published"
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="published" className="text-sm">已发布</label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            保存修改
          </button>
          <Link
            href={`/blog/${post.slug}`}
            className="px-6 py-2 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  )
}
