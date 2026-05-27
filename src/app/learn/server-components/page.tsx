export default function ServerComponentsPage() {
  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-3">React Server Components</h1>
        <p className="text-muted-foreground">React 的革命性架构：服务端组件与客户端组件的混合模式。</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Server Component</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc ml-4">
            <li>服务端渲染，零客户端 JS</li>
            <li>直接访问数据库、文件系统</li>
            <li>可使用 async/await</li>
            <li>不能 useState/useEffect</li>
            <li>不能监听浏览器事件</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
          <h3 className="font-semibold text-amber-900 mb-2">Client Component</h3>
          <ul className="text-sm text-amber-800 space-y-1 list-disc ml-4">
            <li>客户端渲染，交互逻辑</li>
            <li>所有 Hooks 可用</li>
            <li>浏览器 API 可用</li>
            <li>被打包到 bundle</li>
            <li>以 'use client' 标记</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">组合规则</h2>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`// Server Component 可以导入 Client Component
import { Counter } from './Counter'

export default async function Page() {
  const data = await db.query() // ✅ 直接查数据库
  return <Counter initial={data.count} /> // ✅ 传递数据给客户端组件
}

// Client Component 通过 children 接收 Server Component
'use client'
export function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div> // ✅ children 可以是 Server Component
}`}
          </pre>
        </div>
      </section>

      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
        <h4 className="font-semibold text-emerald-900 mb-2">💡 最佳实践</h4>
        <ul className="text-sm text-emerald-800 space-y-1 list-disc ml-5">
          <li>默认所有组件都是 Server Components（Next.js App Router）</li>
          <li>需要交互时才添加 'use client'</li>
          <li>将 Client Components 尽量往下推（叶子节点）</li>
          <li>Server Components 可嵌套在 Client Components 的 children 中</li>
        </ul>
      </div>
    </div>
  )
}
