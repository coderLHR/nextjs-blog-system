import Link from 'next/link'
import { ArrowRight, Route, Database, Server, HardDrive, Zap } from 'lucide-react'

const modules = [
  {
    title: 'App Router 路由',
    href: '/learn/routing',
    icon: <Route className="h-6 w-6 text-blue-500" />,
    desc: '文件系统路由、动态路由、拦截路由、并行路由、路由组',
  },
  {
    title: '数据获取',
    href: '/learn/data-fetching',
    icon: <Database className="h-6 w-6 text-emerald-500" />,
    desc: 'fetch API、Server Actions、Revalidating、Streaming',
  },
  {
    title: 'Server Components',
    href: '/learn/server-components',
    icon: <Server className="h-6 w-6 text-purple-500" />,
    desc: 'RSC 架构、服务端渲染、混合模式、最佳实践',
  },
  {
    title: '缓存策略',
    href: '/learn/caching',
    icon: <HardDrive className="h-6 w-6 text-amber-500" />,
    desc: 'Request Memoization、Data Cache、Full Route Cache、Router Cache',
  },
  {
    title: '性能优化',
    href: '/learn/performance',
    icon: <Zap className="h-6 w-6 text-orange-500" />,
    desc: 'Image 优化、Font 优化、Script 优化、代码分割、ISR',
  },
]

export default function LearnPage() {
  return (
    <div className="container py-10 space-y-10">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Next.js 教学中心</h1>
        <p className="text-muted-foreground leading-relaxed">
          基于 Next.js 15 App Router 的完整教学，覆盖路由、数据获取、Server Components、
          缓存策略和性能优化等核心概念。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="ios-card ios-card-press group flex items-start gap-5 p-6"
          >
            <div className="mt-0.5 shrink-0 w-11 h-11 rounded-2xl bg-muted flex items-center justify-center">
              {m.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors">
                {m.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{m.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1.5 shrink-0" />
          </Link>
        ))}
      </div>

      <div className="rounded-3xl bg-[#0f172a] text-white p-8 shadow-2xl shadow-black/20 border border-white/5">
        <h2 className="text-xl font-semibold tracking-tight mb-5">Next.js 15 核心变化</h2>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mt-0.5 shrink-0">1</span>
            <span><strong className="text-white">默认不缓存</strong>：fetch 和路由处理器默认不缓存，需显式声明</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mt-0.5 shrink-0">2</span>
            <span><strong className="text-white">Turbopack 稳定</strong>：开发模式构建速度大幅提升</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mt-0.5 shrink-0">3</span>
            <span><strong className="text-white">React 19</strong>：支持 Server Actions、useOptimistic、useActionState</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mt-0.5 shrink-0">4</span>
            <span><strong className="text-white">partialPrerender</strong>：部分预渲染（实验性），结合静态和动态</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
