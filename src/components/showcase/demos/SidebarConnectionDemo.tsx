'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * 划词连线演示 (源自 gemini-code-1778829070433)
 * 鼠标悬浮在高亮文字或右侧卡片上时，绘制一条贝塞尔圆角连线
 */
export default function SidebarConnectionDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [svgPath, setSvgPath] = useState('')
  const [points, setPoints] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 })

  const calculatePath = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const source = document.getElementById('sc-source-mark')
    const target = document.getElementById('sc-target-card')
    if (!source || !target) return

    const containerRect = container.getBoundingClientRect()
    const sourceRect = source.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()

    const startX = sourceRect.right - containerRect.left
    const startY = sourceRect.top - containerRect.top + sourceRect.height / 2
    const endX = targetRect.left - containerRect.left
    const endY = targetRect.top - containerRect.top + targetRect.height / 2

    setPoints({ startX, startY, endX, endY })
    setSvgPath(generateStepPath(startX, startY, endX, endY, 12))
  }, [])

  const onEnter = useCallback(() => {
    setIsHovered(true)
    // 等待 DOM 更新（高亮态影响布局虽然不改变坐标，但保守起见下一帧）
    requestAnimationFrame(calculatePath)
  }, [calculatePath])

  const onLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  // 初次挂载与窗口尺寸变化时重算一次
  useEffect(() => {
    calculatePath()
    const onResize = () => calculatePath()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calculatePath])

  return (
    <div className="h-full w-full overflow-auto bg-[#f5f7fa]">
      <div
        ref={containerRef}
        className="layout-container relative mx-auto flex w-full max-w-[1000px] flex-col md:flex-row gap-10 md:gap-[60px] bg-white px-6 py-10 md:px-[60px] md:py-[60px]"
        style={{ minHeight: '100%', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}
      >
        {/* 左侧正文 */}
        <div className="editor-area flex-1 leading-[2.2] text-base text-[#333]">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#2c3e50]">
            划词连线演示
          </h2>
          <p>
            在现代化的在线协作文档中，当你对某段文字做了批注后，它会被
            <span
              id="sc-source-mark"
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
              className="highlight-text"
              style={{
                backgroundColor: 'rgba(66, 185, 131, 0.2)',
                borderBottom: '2px solid #42b983',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'background-color 0.3s',
              }}
            >
              包裹成一个带有特殊背景色的标签
            </span>
            。你可以尝试将鼠标悬浮在这个高亮标签或者右侧的卡片上，此时会出现一条类似脑图结构的连线将它们连接起来。而且这条连线带有平滑的绘制动画。
          </p>
          <p className="mt-4 text-sm text-[#999]">
            ✦ 悬浮高亮文本或右侧批注卡片，连线将以圆角折线呈现，并带绘制动画
          </p>
        </div>

        {/* 右侧侧边栏 */}
        <div className="sidebar-area w-full md:w-[280px] md:mt-[120px]">
          <div
            id="sc-target-card"
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            className="annotation-card"
            style={{
              padding: '20px',
              background: '#ffffff',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            }}
          >
            <h4 className="m-0 mb-2.5 text-[#2c3e50]">批注卡片</h4>
            <p className="m-0 text-sm text-[#666] leading-[1.6]">
              这是针对左侧高亮文本的备注信息。在实际项目中，这里通常会显示评论者的头像、时间和具体的评论内容。
            </p>
          </div>
        </div>

        {/* SVG 连线层 */}
        {isHovered && svgPath && (
          <svg
            className="connection-svg"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <path
              className="animated-path"
              d={svgPath}
              fill="none"
              stroke="#42b983"
              strokeWidth={2.5}
              style={{
                strokeDasharray: 2000,
                strokeDashoffset: 2000,
                animation: 'sc-drawPath 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              }}
            />
            <circle cx={points.startX} cy={points.startY} r={5} fill="#42b983" />
            <circle cx={points.endX} cy={points.endY} r={5} fill="#42b983" />
          </svg>
        )}

        <style jsx>{`
          @keyframes sc-drawPath {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

/**
 * 横-竖-横圆角路径
 */
function generateStepPath(x1: number, y1: number, x2: number, y2: number, r = 10) {
  if (Math.abs(y1 - y2) < 2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }
  const midX = (x1 + x2) / 2
  const dirY = y2 > y1 ? 1 : -1
  const safeR = Math.min(r, Math.abs(y2 - y1) / 2, Math.abs(midX - x1))
  return `M ${x1} ${y1} L ${midX - safeR} ${y1} Q ${midX} ${y1} ${midX} ${y1 + safeR * dirY} L ${midX} ${y2 - safeR * dirY} Q ${midX} ${y2} ${midX + safeR} ${y2} L ${x2} ${y2}`
}
