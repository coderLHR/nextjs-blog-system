'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'

interface CommentItem {
  id: number
  start: number
  end: number
  text: string
  comment: string
  path: string
}

const DEFAULT_TEXT = `Vue3 是一个非常优秀的前端框架。

很多现代编辑器都会支持：
划词批注、评论系统、动态连线。

像 Notion、飞书文档、Google Docs 都有类似能力。

SVG 路径非常适合做这种动态连线效果。`

/**
 * 批注系统 (源自 preview.html)
 * 划词批注 + SVG 动态连线
 */
export default function AnnotationSystemDemo() {
  const [rawText] = useState(DEFAULT_TEXT)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 })

  const contentRef = useRef<HTMLDivElement>(null)
  const pathRefs = useRef<Record<number, SVGPathElement | null>>({})
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const currentSelectionRef = useRef<{ start: number; end: number; text: string } | null>(
    null
  )

  // 渲染带高亮的 HTML
  const renderedHtml = useMemo(() => {
    let text = rawText
    const sorted = [...comments].sort((a, b) => b.start - a.start)
    for (const item of sorted) {
      const selected = text.slice(item.start, item.end)
      text =
        text.slice(0, item.start) +
        `<span class="ann-highlight ${activeId === item.id ? 'active' : ''}" data-id="${item.id}">${selected}</span>` +
        text.slice(item.end)
    }
    return text.replace(/\n/g, '<br/>')
  }, [rawText, comments, activeId])

  // 计算文本偏移
  const getTextOffset = (container: Node, node: Node, offset: number) => {
    const range = document.createRange()
    range.selectNodeContents(container)
    range.setEnd(node, offset)
    return range.toString().length
  }

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return
    const text = selection.toString().trim()
    if (!text) {
      setShowToolbar(false)
      return
    }
    const range = selection.getRangeAt(0)
    const container = contentRef.current
    if (!container) return

    const start = getTextOffset(container, range.startContainer, range.startOffset)
    const end = getTextOffset(container, range.endContainer, range.endOffset)
    currentSelectionRef.current = { start, end, text }

    const rect = range.getBoundingClientRect()
    setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 60 })
    setShowToolbar(true)
  }, [])

  const addComment = useCallback(() => {
    const sel = currentSelectionRef.current
    if (!sel) return
    const newItem: CommentItem = {
      id: Date.now(),
      start: sel.start,
      end: sel.end,
      text: sel.text,
      comment: '这是一个批注内容',
      path: '',
    }
    setComments((prev) => [...prev, newItem])
    setShowToolbar(false)
    window.getSelection()?.removeAllRanges()

    requestAnimationFrame(() => {
      setComments((prev) => prev.map((c) => (c.id === newItem.id ? { ...c, path: buildPath(newItem.id) } : c)))
    })
  }, [])

  const buildPath = (id: number) => {
    const anchorEl = document.querySelector(`[data-id="${id}"]`) as HTMLElement | null
    const cardEl = cardRefs.current[id]
    if (!anchorEl || !cardEl) return ''
    const a = anchorEl.getBoundingClientRect()
    const c = cardEl.getBoundingClientRect()
    const x1 = a.right + 8
    const y1 = a.top + a.height / 2
    const x2 = c.left
    const y2 = c.top + c.height / 2
    if (Math.abs(y1 - y2) < 20) {
      return `M ${x1} ${y1} L ${x2} ${y2}`
    }
    const midX = (x1 + x2) / 2
    return `M ${x1} ${y1} L ${midX - 20} ${y1} Q ${midX} ${y1} ${midX} ${y1 + 20} L ${midX} ${y2 - 20} Q ${midX} ${y2} ${midX + 20} ${y2} L ${x2} ${y2}`
  }

  // 更新所有连线
  const updateAllPaths = useCallback(() => {
    setComments((prev) => prev.map((c) => ({ ...c, path: buildPath(c.id) })))
  }, [])

  // 路径动画
  useEffect(() => {
    comments.forEach((item) => {
      const el = pathRefs.current[item.id]
      if (!el || !item.path) return
      const length = el.getTotalLength()
      el.style.strokeDasharray = String(length)
      el.style.strokeDashoffset = String(length)
      requestAnimationFrame(() => {
        el.style.transition = 'stroke-dashoffset .7s ease'
        el.style.strokeDashoffset = '0'
      })
    })
  }, [comments])

  // 监听 resize / scroll
  useEffect(() => {
    const onUpdate = () => updateAllPaths()
    window.addEventListener('resize', onUpdate)
    window.addEventListener('scroll', onUpdate, true)
    return () => {
      window.removeEventListener('resize', onUpdate)
      window.removeEventListener('scroll', onUpdate, true)
    }
  }, [updateAllPaths])

  const handleHighlightOver = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const id = target.dataset.id
    if (id) setActiveId(Number(id))
  }

  return (
    <div className="h-full w-full overflow-auto bg-[#f5f7fb]">
      <div className="flex min-h-full flex-col md:flex-row relative">
        <style>{`
          .ann-highlight {
            background: rgba(59, 130, 246, 0.16);
            border-bottom: 2px wavy #3b82f6;
            cursor: pointer;
            transition: all 0.25s;
          }
          .ann-highlight.active {
            background: rgba(59, 130, 246, 0.28);
          }
          .ann-link {
            fill: none;
            stroke: #94a3b8;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
            transition: all 0.25s;
          }
          .ann-link.active {
            stroke: #3b82f6;
            stroke-width: 4;
            filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.4));
          }
        `}</style>

        {/* SVG 连线层 */}
        <svg
          className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen"
        >
          {comments.map((item) => (
            <path
              key={item.id}
              ref={(el) => {
                pathRefs.current[item.id] = el
              }}
              d={item.path}
              className={`ann-link ${activeId === item.id ? 'active' : ''}`}
            />
          ))}
        </svg>

        {/* 正文 */}
        <div
          ref={contentRef}
          onMouseUp={handleMouseUp}
          onMouseOver={handleHighlightOver}
          onMouseOut={(e) => {
            const target = e.target as HTMLElement
            const id = target.dataset.id
            if (id) setActiveId(null)
          }}
          className="relative z-[2] flex-1 px-6 py-12 md:px-20 md:py-20 text-lg leading-loose"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />

        {/* 侧边栏 */}
        <div className="relative z-[2] w-full md:w-[320px] border-l border-[#ddd] bg-white px-5 py-12 md:px-5 md:py-14">
          {comments.map((item) => (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current[item.id] = el
              }}
              onMouseEnter={() => setActiveId(item.id)}
              onMouseLeave={() => setActiveId(null)}
              className={[
                'mb-5 cursor-pointer rounded-[14px] border bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all',
                activeId === item.id
                  ? '-translate-x-1 border-[#3b82f6] bg-[#eff6ff]'
                  : 'border-[#e5e7eb]',
              ].join(' ')}
            >
              <strong>批注 {item.id}</strong>
              <div className="mt-2.5 text-sm">{item.comment}</div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-sm text-[#94a3b8]">在左侧正文中划选文字即可添加批注</div>
          )}
        </div>

        {/* 工具栏 */}
        {showToolbar && (
          <div
            className="fixed z-[9999] flex gap-2.5 rounded-xl bg-[#111827] px-3.5 py-2.5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
            style={{
              left: toolbarPos.x,
              top: toolbarPos.y,
              transform: 'translateX(-50%)',
            }}
          >
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={addComment}
              className="cursor-pointer rounded-lg border-none bg-[#3b82f6] px-3.5 py-2 text-sm text-white transition-opacity hover:opacity-90"
            >
              添加批注
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
