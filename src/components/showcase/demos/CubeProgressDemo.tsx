'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

/**
 * 伪 3D 立方体进度条 (源自 gemini-code-1778832917165)
 * 通过等距投影 SVG polygons 表现立体感，slider 实时控制高度
 */
export default function CubeProgressDemo() {
  const [targetProgress, setTargetProgress] = useState(65)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [hovered, setHovered] = useState(false)
  const animationRef = useRef<number | null>(null)

  // 几何参数
  const cx = 100
  const cy = 260
  const dx = 45
  const dy = 22.5
  const maxH = 180

  // 丝滑阻尼补间动画
  useEffect(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }
    const animate = () => {
      setDisplayProgress((cur) => {
        const diff = targetProgress - cur
        if (Math.abs(diff) < 0.1) return targetProgress
        return cur + diff * 0.1
      })
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    }
  }, [targetProgress])

  const getPoints = (h: number) => ({
    left: `${cx},${cy} ${cx - dx},${cy - dy} ${cx - dx},${cy - dy - h} ${cx},${cy - h}`,
    right: `${cx},${cy} ${cx + dx},${cy - dy} ${cx + dx},${cy - dy - h} ${cx},${cy - h}`,
    top: `${cx},${cy - h} ${cx - dx},${cy - dy - h} ${cx},${cy - 2 * dy - h} ${cx + dx},${cy - dy - h}`,
  })

  const bgPoints = useMemo(() => getPoints(maxH), [maxH])
  const fgPoints = useMemo(
    () => getPoints(maxH * (displayProgress / 100)),
    [displayProgress]
  )

  const showY = cy - maxH * (displayProgress / 100) - 25

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f8fafc] p-6">
      <div
        className="flex w-full max-w-md flex-col items-center gap-8 rounded-3xl border border-[#e2e8f0] bg-white p-10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),0_4px_6px_-4px_rgba(0,0,0,0.02)]"
      >
        <div className="text-lg font-semibold tracking-tight text-[#0f172a]">
          数据完成度
        </div>

        <svg
          className="w-[280px] overflow-visible"
          viewBox="0 0 200 320"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: `center ${cy + 60}px`,
              transform: hovered
                ? 'translateY(-8px) scale(1.02)'
                : 'translateY(0) scale(1)',
              cursor: 'pointer',
            }}
          >
            {/* 底部环境投影 */}
            <ellipse
              cx={cx}
              cy={cy + 5}
              rx={55}
              ry={25}
              fill="rgba(0,0,0,0.06)"
              style={{
                transition: 'all 0.4s ease',
                fill: hovered ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0,0,0,0.06)',
              }}
            />

            {/* 背景柱体 */}
            <g stroke="rgba(255,255,255,0.4)" strokeWidth={1} strokeLinejoin="round">
              <polygon points={bgPoints.left} fill="rgba(148, 163, 184, 0.15)" />
              <polygon points={bgPoints.right} fill="rgba(148, 163, 184, 0.25)" />
              <polygon points={bgPoints.top} fill="rgba(148, 163, 184, 0.08)" />
            </g>

            {/* 进度柱体 */}
            <g stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeLinejoin="round">
              <polygon points={fgPoints.left} fill="#059669" />
              <polygon points={fgPoints.right} fill="#047857" />
              <polygon points={fgPoints.top} fill="#34d399" />
            </g>

            {/* 悬浮的进度数值提示 */}
            <g transform={`translate(${cx}, ${showY})`}>
              <text
                x={0}
                y={-10}
                textAnchor="middle"
                fill="#0f172a"
                fontSize={16}
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {Math.round(displayProgress)}%
              </text>
              <line
                x1={0}
                y1={-5}
                x2={0}
                y2={15}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="2,2"
              />
            </g>
          </g>
        </svg>

        {/* 交互控制区 */}
        <div className="flex w-full flex-col gap-3">
          <div className="flex justify-between text-sm font-medium text-[#64748b]">
            <span>0%</span>
            <span>目标进度: {targetProgress}%</span>
            <span>100%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={targetProgress}
            onChange={(e) => setTargetProgress(Number(e.target.value))}
            className="cp-slider h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e2e8f0] outline-none transition-colors"
          />
        </div>

        <style jsx>{`
          .cp-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #10b981;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            transition: transform 0.2s;
          }
          .cp-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
          .cp-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #10b981;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            transition: transform 0.2s;
          }
          .cp-slider::-moz-range-thumb:hover {
            transform: scale(1.15);
          }
        `}</style>
      </div>
    </div>
  )
}
