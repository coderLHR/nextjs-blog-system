import { createPost } from '@/lib/actions'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewPostPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </Link>

      <h1 className="text-2xl font-bold mb-6">新建文章</h1>

      <form action={createPost} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">标题</label>
          <input
            name="title"
            required
            placeholder="文章标题"
            className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Slug（URL 标识）</label>
          <input
            name="slug"
            placeholder="自定义 URL，留空将自动根据标题生成"
            className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">摘要</label>
          <textarea
            name="excerpt"
            rows={2}
            placeholder="简短描述，留空将自动截取正文前 200 字"
            className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">正文（支持 Markdown）</label>
          <textarea
            name="content"
            required
            rows={16}
            placeholder="# 标题&#10;&#10;正文内容..."
            className="w-full px-3 py-2 rounded-md border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            name="published"
            type="checkbox"
            defaultChecked
            id="published"
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="published" className="text-sm">立即发布</label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            发布文章
          </button>
          <Link
            href="/blog"
            className="px-6 py-2 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  )
}
