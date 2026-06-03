'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  SidebarConnectionDemo,
  CubeProgressDemo,
  LudoGameDemo,
  AbilityModel3DDemo,
  LegalAbilityModelDemo,
  RadialKnowledgeGraphDemo,
  AnnotationSystemDemo,
  KnowledgeUniverseDemo,
  KnowledgeUniverse3Demo,
} from './demos'
import {
  PencilLine,
  MessageSquareText,
  Box,
  Dice5,
  Boxes,
  Scale,
  Share2,
  Globe2,
  Orbit,
  PanelLeft,
  ChevronLeft,
} from 'lucide-react'

type DemoKey =
  | 'sidebar-connection'
  | 'cube-progress'
  | 'ludo-game'
  | 'ability-model-3d'
  | 'legal-ability-model'
  | 'radial-knowledge'
  | 'annotation-system'
  | 'knowledge-universe'
  | 'knowledge-universe-3'

interface DemoEntry {
  key: DemoKey
  label: string
  short: string
  group: string
  Component: React.ComponentType
  icon: React.ComponentType<{ className?: string }>
}

const DEMOS: DemoEntry[] = [
  {
    key: 'sidebar-connection',
    label: '划词连线',
    short: '01',
    group: '交互批注',
    Component: SidebarConnectionDemo,
    icon: PencilLine,
  },
  {
    key: 'annotation-system',
    label: '批注系统',
    short: '02',
    group: '交互批注',
    Component: AnnotationSystemDemo,
    icon: MessageSquareText,
  },
  {
    key: 'cube-progress',
    label: '立方体进度条',
    short: '03',
    group: '数据可视化',
    Component: CubeProgressDemo,
    icon: Box,
  },
  {
    key: 'ludo-game',
    label: '飞行棋',
    short: '04',
    group: '游戏化',
    Component: LudoGameDemo,
    icon: Dice5,
  },
  {
    key: 'ability-model-3d',
    label: '3D 能力模型',
    short: '05',
    group: '三维模型',
    Component: AbilityModel3DDemo,
    icon: Boxes,
  },
  {
    key: 'legal-ability-model',
    label: '法律能力图谱',
    short: '06',
    group: '图谱',
    Component: LegalAbilityModelDemo,
    icon: Scale,
  },
  {
    key: 'radial-knowledge',
    label: '放射知识图谱',
    short: '07',
    group: '图谱',
    Component: RadialKnowledgeGraphDemo,
    icon: Share2,
  },
  {
    key: 'knowledge-universe',
    label: '知识宇宙 II',
    short: '09',
    group: '知识宇宙',
    Component: KnowledgeUniverseDemo,
    icon: Globe2,
  },
  {
    key: 'knowledge-universe-3',
    label: '知识宇宙 III',
    short: '10',
    group: '知识宇宙',
    Component: KnowledgeUniverse3Demo,
    icon: Orbit,
  },
]

export default function ShowcaseShell() {
  const [activeKey, setActiveKey] = useState<DemoKey>('sidebar-connection')
  const [collapsed, setCollapsed] = useState(false)

  const active = useMemo(
    () => DEMOS.find((d) => d.key === activeKey) ?? DEMOS[0],
    [activeKey]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, DemoEntry[]>()
    for (const d of DEMOS) {
      const list = map.get(d.group) ?? []
      list.push(d)
      map.set(d.group, list)
    }
    return Array.from(map.entries())
  }, [])

  const handleSelect = useCallback((key: DemoKey) => {
    setActiveKey(key)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.target instanceof HTMLTextAreaElement) return
      const idx = DEMOS.findIndex((d) => d.key === activeKey)
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        const next = DEMOS[(idx + 1) % DEMOS.length]
        setActiveKey(next.key)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev = DEMOS[(idx - 1 + DEMOS.length) % DEMOS.length]
        setActiveKey(prev.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeKey])

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* 左侧悬浮锚点侧栏 */}
      <aside
        className={[
          'fixed left-3 top-16 bottom-4 z-40 flex flex-col',
          'rounded-2xl border border-border/50 shadow-lg',
          'backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]',
          collapsed ? 'w-[60px]' : 'w-[232px]',
        ].join(' ')}
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(245,245,247,0.76) 100%)',
        }}
      >
        {/* Header */}
        <div
          className={[
            'flex items-center shrink-0 border-b border-border/40',
            collapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3',
          ].join(' ')}
        >
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/80">
                Showcase
              </span>
              <span className="text-[13px] font-semibold text-foreground truncate">
                交互效果展示厅
              </span>
            </div>
          )}
          <button
            type="button"
            aria-label={collapsed ? '展开侧栏' : '折叠侧栏'}
            onClick={() => setCollapsed((v) => !v)}
            className={[
              'inline-flex h-7 w-7 items-center justify-center rounded-lg',
              'text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all',
              collapsed ? '' : 'ml-auto',
            ].join(' ')}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-3">
          {grouped.map(([group, items]) => (
            <div key={group}>
              {!collapsed && (
                <div className="flex items-center gap-2 px-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                    {group}
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
              )}
              {collapsed && (
                <div className="flex justify-center mb-2">
                  <div className="h-px w-5 bg-border/60" />
                </div>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive = item.key === activeKey
                  const Icon = item.icon
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.key)}
                        title={item.label}
                        className={[
                          'group relative flex w-full items-center gap-2.5 rounded-xl transition-all duration-200',
                          collapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        ].join(' ')}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                        )}
                        <span
                          className={[
                            'shrink-0 flex items-center justify-center rounded-lg transition-all',
                            collapsed ? 'h-8 w-8' : 'h-7 w-7',
                            isActive
                              ? 'bg-white/20'
                              : 'bg-muted/60 group-hover:bg-background',
                          ].join(' ')}
                        >
                          <Icon
                            className={[
                              'transition-transform',
                              collapsed ? 'h-4 w-4' : 'h-3.5 w-3.5',
                              isActive ? 'text-primary-foreground' : '',
                            ].join(' ')}
                          />
                        </span>
                        {!collapsed && (
                          <span
                            className={[
                              'truncate text-[13px] transition-all',
                              isActive ? 'font-semibold' : 'font-medium',
                            ].join(' ')}
                          >
                            {item.label}
                          </span>
                        )}
                        {!collapsed && isActive && (
                          <span className="ml-auto text-[10px] font-bold opacity-70 tabular-nums">
                            {item.short}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer — keyboard hint */}
        {!collapsed && (
          <div className="shrink-0 border-t border-border/40 px-4 py-2">
            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono font-bold">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono font-bold">↓</kbd>
              <span>切换演示</span>
            </p>
          </div>
        )}
      </aside>

      {/* 主内容区 */}
      <main className="absolute inset-0">
        <div className="relative h-full w-full overflow-hidden bg-background">
          <div
            key={active.key}
            className="h-full w-full animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <active.Component />
          </div>

          {/* 右下角当前 demo 信息 */}
          <div className="pointer-events-none fixed bottom-4 right-4 z-30 select-none">
            <div className="rounded-full border border-border/50 backdrop-blur-xl bg-background/70 px-3.5 py-1.5 text-[11px] font-medium tracking-tight text-muted-foreground shadow-sm">
              <span className="text-foreground font-semibold">{active.short}</span>
              <span className="mx-1.5 opacity-30">/</span>
              <span>{active.label}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
