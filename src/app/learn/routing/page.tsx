export default function RoutingPage() {
  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-3">App Router 路由系统</h1>
        <p className="text-muted-foreground">基于文件系统的声明式路由，支持嵌套布局、动态路由和高级路由模式。</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">基础路由</h2>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`app/
├── page.tsx              → /
├── about/page.tsx        → /about
├── blog/page.tsx         → /blog
└── blog/[slug]/page.tsx  → /blog/:slug`}
          </pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">布局 Layout</h2>
        <p className="text-sm text-muted-foreground">layout.tsx 在同级路由和子路由之间共享，导航时保持状态不重新渲染。</p>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>共享导航</nav>
      <main>{children}</main>
    </div>
  )
}`}
          </pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">动态路由</h2>
        <div className="p-4 rounded-lg border bg-card space-y-2">
          <p className="text-sm"><strong>[id]</strong> — 动态段</p>
          <p className="text-sm"><strong>[...slug]</strong> — 捕获所有</p>
          <p className="text-sm"><strong>[[...slug]]</strong> — 可选捕获所有</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">路由组</h2>
        <p className="text-sm text-muted-foreground">使用括号创建路由组，不影响 URL 结构：</p>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm">app/(marketing)/page.tsx → /</pre>
        </div>
      </section>

      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
        <h4 className="font-semibold text-emerald-900 mb-2">💡 最佳实践</h4>
        <ul className="text-sm text-emerald-800 space-y-1 list-disc ml-5">
          <li>使用 loading.tsx 提供即时加载反馈</li>
          <li>使用 error.tsx 处理路由级错误</li>
          <li>布局应尽量靠近叶子节点，减少不必要的渲染范围</li>
          <li>动态路由配合 generateStaticParams 实现 SSG</li>
        </ul>
      </div>
    </div>
  )
}
