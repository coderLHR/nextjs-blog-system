export default function CachingPage() {
  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-3">缓存策略</h1>
        <p className="text-muted-foreground">Next.js 15 的多层缓存架构和精细控制。</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">四层缓存模型</h2>
        <div className="space-y-3">
          {[
            {
              name: 'Request Memoization',
              scope: '单次请求生命周期',
              desc: '自动去重相同 URL 的 fetch，避免重复请求',
              control: '自动',
            },
            {
              name: 'Data Cache',
              scope: '跨请求、跨部署',
              desc: '缓存 fetch 的响应，可控制 revalidate',
              control: 'fetch 选项',
            },
            {
              name: 'Full Route Cache',
              scope: '构建时 / 请求时',
              desc: '渲染结果的 HTML/RSC payload 缓存',
              control: 'segment config',
            },
            {
              name: 'Router Cache',
              scope: '客户端会话',
              desc: '浏览器中缓存 RSC payload，提升导航体验',
              control: '自动 / 30s',
            },
          ].map((c) => (
            <div key={c.name} className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{c.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{c.control}</span>
              </div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
              <p className="text-xs text-muted-foreground mt-1">作用域: {c.scope}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">动态渲染 vs 静态渲染</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-medium mb-2">静态渲染（默认）</h3>
            <p className="text-sm text-muted-foreground">构建时渲染，可 CDN 缓存，适合不依赖请求数据的内容。</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-medium mb-2">动态渲染</h3>
            <p className="text-sm text-muted-foreground">请求时渲染，可访问 cookies/headers/searchParams。</p>
          </div>
        </div>
      </section>

      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
        <h4 className="font-semibold text-emerald-900 mb-2">💡 Next.js 15 缓存变化</h4>
        <ul className="text-sm text-emerald-800 space-y-1 list-disc ml-5">
          <li>fetch 默认 <strong>不缓存</strong>（cache: 'no-store'）</li>
          <li>路由处理器默认 <strong>动态渲染</strong></li>
          <li>需要缓存时显式声明：fetch(url, {'{ cache: "force-cache" }'})</li>
          <li>使用 revalidatePath / revalidateTag 按需刷新</li>
        </ul>
      </div>
    </div>
  )
}
