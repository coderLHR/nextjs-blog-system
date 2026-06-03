'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'

type NodeType = 'normal' | 'forward' | 'backward'

interface AnimeInstance {
  set: (el: Element, props: Record<string, unknown>) => void
  remove: (el: Element) => void
  (opts: Record<string, unknown>): { finished: Promise<void>; progress: number }
}

type WindowWithAnime = Window & typeof globalThis & { anime: AnimeInstance }

interface PathNode {
  id: number
  x: number
  y: number
  type: NodeType
}

const TRACK_PATH =
  'M 120 500 L 780 500 C 900 500, 900 350, 780 350 L 120 350 C 0 350, 0 200, 120 200 L 780 200 C 900 200, 900 50, 780 50 L 120 50'
const TOTAL_NODES = 31

/**
 * 现代飞行棋 (源自 gemini-code-1778834322398)
 * 使用 Anime.js 做棋子跳跃与骰子物理动画
 */
export default function LudoGameDemo() {
  const [animeReady, setAnimeReady] = useState(false)
  const [nodes, setNodes] = useState<PathNode[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRolling, setIsRolling] = useState(false)
  const [diceFace, setDiceFace] = useState('🎲')
  const [statusText, setStatusText] = useState('等待掷骰子...')
  const [toastMsg, setToastMsg] = useState('')

  const playerRef = useRef<SVGGElement>(null)
  const diceRef = useRef<HTMLButtonElement>(null)
  const toastRef = useRef<HTMLDivElement>(null)

  // 初始化跑道节点
  useEffect(() => {
    if (!animeReady) return
    const path = document.getElementById('lg-track-path') as unknown as SVGPathElement
    if (!path) return
    const length = path.getTotalLength()
    const stepLength = length / (TOTAL_NODES - 1)
    const arr: PathNode[] = []
    for (let i = 0; i < TOTAL_NODES; i++) {
      const point = path.getPointAtLength(i * stepLength)
      let type: NodeType = 'normal'
      if (i > 1 && i < TOTAL_NODES - 2 && arr[i - 1].type === 'normal') {
        const rand = Math.random()
        if (rand < 0.15) type = 'forward'
        else if (rand < 0.30) type = 'backward'
      }
      arr.push({ id: i, x: point.x, y: point.y, type })
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodes(arr)
  }, [animeReady])

  // 节点初始化后将玩家设置到起点
  useEffect(() => {
    if (nodes.length === 0) return
    const w = window as WindowWithAnime
    if (playerRef.current && w.anime) {
      w.anime.set(playerRef.current, {
        translateX: nodes[0].x,
        translateY: nodes[0].y,
      })
    }
  }, [nodes])

  const nodeColor = (type: NodeType) => {
    if (type === 'forward') return 'var(--lg-forward)'
    if (type === 'backward') return 'var(--lg-backward)'
    return '#cbd5e1'
  }

  const showToast = useCallback(
    (msg: string) => {
      setToastMsg(msg)
      const w = window as WindowWithAnime
      if (!toastRef.current || !w.anime) return
      w.anime.remove(toastRef.current)
      w.anime({
        targets: toastRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 400,
        easing: 'easeOutExpo',
        direction: 'alternate',
        loop: 2,
        loopComplete: () => setToastMsg(''),
      })
    },
    []
  )

  const movePlayer = useCallback(
    async (steps: number) => {
      const w = window as WindowWithAnime
      if (!w.anime || !playerRef.current) return
      const dir = steps > 0 ? 1 : -1
      let remaining = Math.abs(steps)
      let idx = currentIndex

      while (remaining > 0) {
        let nextIndex = idx + dir
        if (nextIndex < 0) nextIndex = 0
        if (nextIndex >= TOTAL_NODES) nextIndex = TOTAL_NODES - 1
        if (nextIndex === idx) break
        idx = nextIndex
        const target = nodes[idx]
        await w
          .anime({
            targets: playerRef.current,
            translateX: target.x,
            translateY: target.y,
            scaleY: [
              { value: 0.8, duration: 100 },
              { value: 1.1, duration: 150 },
              { value: 1, duration: 150 },
            ],
            duration: 400,
            easing: 'easeInOutSine',
          })
          .finished
        remaining--
      }
      setCurrentIndex(idx)
    },
    [currentIndex, nodes]
  )

  const rollDice = useCallback(async () => {
    if (isRolling) return
    const w = window as WindowWithAnime
    if (!w.anime) return
    setIsRolling(true)

    // 如果在终点则重置
    if (currentIndex >= TOTAL_NODES - 1) {
      setCurrentIndex(0)
      if (playerRef.current && nodes[0]) {
        const w = window as WindowWithAnime
        w.anime.set(playerRef.current, {
          translateX: nodes[0].x,
          translateY: nodes[0].y,
        })
      }
      setIsRolling(false)
      setStatusText('重新开始！')
      setDiceFace('🎲')
      return
    }

    setStatusText('摇晃中...')

    await w
      .anime({
        targets: diceRef.current,
        rotateZ: [0, 360],
        scale: [1, 1.2, 0.9, 1],
        duration: 600,
        easing: 'easeInOutQuad',
        update: (anim: { progress: number }) => {
          if (Math.round(anim.progress) % 10 === 0) {
            setDiceFace(String(Math.floor(Math.random() * 6) + 1))
          }
        },
      })
      .finished

    const steps = Math.floor(Math.random() * 6) + 1
    setDiceFace(String(steps))
    setStatusText(`移动 ${steps} 步`)

    await movePlayer(steps)

    // 关卡事件
    const finalNode = nodes[currentIndex]
    if (finalNode) {
      if (finalNode.type === 'forward') {
        setStatusText('触发机关！前进 2 步')
        showToast('🚀 幸运喷气包！冲！')
        await new Promise((r) => setTimeout(r, 600))
        await movePlayer(2)
      } else if (finalNode.type === 'backward') {
        setStatusText('踩到陷阱！后退 2 步')
        showToast('💣 哎呀，踩到香蕉皮了')
        await new Promise((r) => setTimeout(r, 600))
        await movePlayer(-2)
      }
    }

    if (currentIndex >= TOTAL_NODES - 1) {
      setStatusText('🎉 抵达终点，你赢了！')
      showToast('🏆 游戏通关！')
      setDiceFace('↻')
    } else {
      setStatusText('等待下一次掷骰...')
    }

    setIsRolling(false)
  }, [currentIndex, isRolling, movePlayer, nodes, showToast])

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#f1f5f9] p-4">
      <Script
        src="https://unpkg.com/animejs@3.2.1/lib/anime.min.js"
        strategy="afterInteractive"
        onLoad={() => setAnimeReady(true)}
      />

      <div
        className="relative flex h-full max-h-[720px] w-full max-w-[1000px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)]"
        style={{ ['--lg-track-base' as string]: '#e2e8f0', ['--lg-track-dash' as string]: '#94a3b8', ['--lg-forward' as string]: '#10b981', ['--lg-backward' as string]: '#f43f5e' } as React.CSSProperties}
      >
        {/* 图例 */}
        <div className="absolute left-7 top-7 z-10 flex flex-col gap-2.5 rounded-xl bg-white/90 p-4 text-[13px] text-[#475569] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-[3px] border-[#cbd5e1] bg-white" />
            普通步数
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-[3px] border-[#10b981] bg-white" />
            幸运喷气包 (+2步)
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-[3px] border-[#f43f5e] bg-white" />
            踩到香蕉皮 (-2步)
          </div>
        </div>

        {/* 提示 toast */}
        <div
          ref={toastRef}
          className="pointer-events-none absolute left-1/2 top-10 z-50 -translate-x-1/2 rounded-full bg-[#1e293b] px-6 py-3 text-base font-medium text-white opacity-0 shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
        >
          {toastMsg}
        </div>

        <div className="relative flex-1">
          <svg
            className="block h-full w-full"
            viewBox="0 0 900 600"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              id="lg-track-path"
              d={TRACK_PATH}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={40}
              strokeLinecap="round"
            />
            <path
              d={TRACK_PATH}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="8 12"
              className="lg-track-dash"
            />

            {nodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={12}
                  fill="#ffffff"
                  stroke={nodeColor(node.type)}
                  strokeWidth={4}
                />
                {node.id === 0 && (
                  <text
                    x={node.x}
                    y={node.y + 35}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight="bold"
                    fill="#64748b"
                  >
                    START
                  </text>
                )}
                {node.id === TOTAL_NODES - 1 && (
                  <text
                    x={node.x}
                    y={node.y - 25}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight="bold"
                    fill="#f59e0b"
                  >
                    WIN
                  </text>
                )}
              </g>
            ))}

            <g ref={playerRef} className="lg-player">
              <ellipse cx={0} cy={18} rx={14} ry={6} fill="rgba(0,0,0,0.15)" />
              <path
                d="M 0 14 C -12 14, -16 0, -16 -10 C -16 -20, -8 -28, 0 -28 C 8 -28, 16 -20, 16 -10 C 16 0, 12 14, 0 14 Z"
                fill="url(#lg-player-grad)"
              />
              <circle cx={-5} cy={-16} r={4} fill="rgba(255,255,255,0.4)" />
            </g>

            <defs>
              <linearGradient id="lg-player-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 控制面板 */}
        <div className="absolute bottom-7 right-10 z-10 flex items-center gap-5 rounded-2xl border border-white/60 bg-white/85 px-8 py-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] backdrop-blur-xl">
          <div className="flex flex-col">
            <span className="mb-1 text-[14px] font-semibold uppercase tracking-widest text-[#64748b]">
              当前状态
            </span>
            <span className="min-w-[120px] text-lg font-bold text-[#1e293b]">
              {statusText}
            </span>
          </div>
          <button
            ref={diceRef}
            onClick={rollDice}
            disabled={isRolling || !animeReady}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-none text-3xl font-bold text-white shadow-[0_8px_16px_rgba(59,130,246,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] transition-shadow disabled:cursor-not-allowed disabled:bg-[#cbd5e1] disabled:shadow-none"
            style={{
              background: isRolling
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            }}
          >
            {diceFace}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes lg-dash-flow {
          to {
            stroke-dashoffset: -20;
          }
        }
        :global(.lg-track-dash) {
          animation: lg-dash-flow 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
