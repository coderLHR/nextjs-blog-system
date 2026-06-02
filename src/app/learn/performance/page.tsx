
export default function PerformancePage() {
  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-3">性能优化</h1>
        <p className="text-muted-foreground">Next.js 内置的优化能力和最佳实践。</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Image 优化</h2>
        <p className="text-sm text-muted-foreground">next/image 自动优化图片：WebP/AVIF 转换、响应式尺寸、懒加载。</p>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`import Image from 'next/image'

<Image
  src="/photo.jpg"
  alt="描述"
  width={800}
  height={600}
  priority        // 首屏图片预加载
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>`}
          </pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Font 优化</h2>
        <p className="text-sm text-muted-foreground">next/font 自动优化字体加载，消除布局偏移：</p>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Layout({ children }) {
  return <body className={inter.className}>{children}</body>
}`}
          </pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">ISR 增量静态再生</h2>
        <p className="text-sm text-muted-foreground">无需重建整个站点，按需更新特定页面：</p>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`// 每 60 秒重新生成一次
export const revalidate = 60

// 生成静态路径
export async function generateStaticParams() {
  const posts = await fetchPosts()
  return posts.map((post) => ({ slug: post.slug }))
}`}
          </pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Streaming & Suspense</h2>
        <p className="text-sm text-muted-foreground">使用 React Suspense 实现渐进式加载：</p>
        <div className="p-4 rounded-lg border bg-card">
          <pre className="text-sm overflow-x-auto">
{`import { Suspense } from 'react'

<Suspense fallback={<Skeleton />}>
  <Comments postId={id} />
</Suspense>`}
          </pre>
        </div>
      </section>

      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
        <h4 className="font-semibold text-emerald-900 mb-2">💡 性能优化清单</h4>
        <ul className="text-sm text-emerald-800 space-y-1 list-disc ml-5">
          <li>使用 next/image 替代 img 标签</li>
          <li>使用 next/font 加载字体</li>
          <li>使用 next/script 控制第三方脚本加载策略</li>
          <li>为动态导入使用 React.lazy + Suspense</li>
          <li>使用 ISR 或 SSG 减少服务端渲染压力</li>
          <li>启用 Turbopack 加速开发构建</li>
        </ul>
      </div>
    </div>
  )
}
