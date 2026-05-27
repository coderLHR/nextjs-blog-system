export default function DataFetchingPage() {
  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-3">数据获取</h1>
        <p className="text-muted-foreground">Next.js 15 中的数据获取模式：Server Components、Server Actions 和缓存控制。</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Server Component 中获取数据</h2>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`export default async function Page() {
  // 直接在服务端获取数据
  const data = await fetch('https://api.example.com/posts')
  const posts = await data.json()

  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}`}
          </pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Server Actions</h2>
        <p className="text-sm text-muted-foreground">在服务端执行的异步函数，可直接操作数据库：</p>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  await prisma.post.create({ data: { title } })
  revalidatePath('/posts')
}`}
          </pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">缓存控制</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-sm font-medium mb-1">强制缓存</p>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{'{ cache: "force-cache" }'}</code>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-sm font-medium mb-1">按需重新验证</p>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{'{ next: { revalidate: 60 } }'}</code>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-sm font-medium mb-1">不缓存</p>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{'{ cache: "no-store" }'}</code>
          </div>
        </div>
      </section>

      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
        <h4 className="font-semibold text-emerald-900 mb-2">💡 最佳实践</h4>
        <ul className="text-sm text-emerald-800 space-y-1 list-disc ml-5">
          <li>优先在 Server Component 中获取数据，减少客户端 JS</li>
          <li>使用 Server Actions 处理表单提交，无需手动创建 API</li>
          <li>数据变更后使用 revalidatePath 或 revalidateTag 更新缓存</li>
          <li>敏感操作在 Server Action 中验证用户权限</li>
        </ul>
      </div>
    </div>
  )
}
