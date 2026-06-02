'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { Briefcase, BookOpen, CircleAlert, CheckCircle2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AbilityItem {
  id: string
  text: string
  matched: boolean
}

interface AbilityGroup {
  id: string
  title: string
  items: AbilityItem[]
}

interface Course {
  id: string
  name: string
  tag: string
  tagColor: 'blue' | 'green'
  credits: string
  semester: string
  hours: string
  major: string
  highlighted: boolean
}

interface Connection {
  from: string
  to: string
  color: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const abilityGroups: AbilityGroup[] = [
  {
    id: 'ag1',
    title: '数字化产品管理知识',
    items: [
      { id: 'a1', text: '推进公司信息技术防护体系设计', matched: false },
      { id: 'a2', text: '安全测试、安全检查', matched: true },
      { id: 'a3', text: '管理各类信息安全', matched: true },
      { id: 'a4', text: '资产平台建设及日常维护', matched: false },
    ],
  },
  {
    id: 'ag2',
    title: '数字化产品管理知识',
    items: [
      { id: 'a5', text: '推进公司信息技术防护体系设计', matched: false },
      { id: 'a6', text: '安全测试、安全检查', matched: true },
      { id: 'a7', text: '管理各类信息安全', matched: true },
      { id: 'a8', text: '资产平台建设及日常维护', matched: false },
      { id: 'a9', text: '管理各类信息安全', matched: true },
    ],
  },
]

const courses: Course[] = [
  {
    id: 'c1', name: '《汽车工程基础汽车工程基础汽车工程基础》',
    tag: '智慧课程', tagColor: 'blue',
    credits: '99', semester: '9', hours: '999', major: '专业名称', highlighted: false,
  },
  {
    id: 'c2', name: '《汽车工程基础汽车工程基础汽车工程基础》',
    tag: '项目制课程', tagColor: 'green',
    credits: '99', semester: '9', hours: '999', major: '专业名称', highlighted: true,
  },
  {
    id: 'c3', name: '《汽车工程基础汽车工程基础汽车工程基础》',
    tag: '项目制课程', tagColor: 'green',
    credits: '99', semester: '9', hours: '999', major: '专业名称', highlighted: true,
  },
  {
    id: 'c4', name: '《汽车工程基础汽车工程基础汽车工程基础》',
    tag: '智慧课程', tagColor: 'blue',
    credits: '99', semester: '9', hours: '999', major: '专业名称', highlighted: false,
  },
  {
    id: 'c5', name: '《汽车工程基础汽车工程基础汽车工程基础》',
    tag: '项目制课程', tagColor: 'green',
    credits: '99', semester: '9', hours: '999', major: '专业名称', highlighted: true,
  },
  {
    id: 'c6', name: '《汽车工程基础汽车工程基础汽车工程基础》',
    tag: '项目制课程', tagColor: 'green',
    credits: '99', semester: '9', hours: '999', major: '专业名称', highlighted: false,
  },
]

const connections: Connection[] = [
  { from: 'a2', to: 'c1', color: '#5E79FF' },
  { from: 'a3', to: 'c1', color: '#5E79FF' },
  { from: 'a6', to: 'c2', color: '#9359FF' },
  { from: 'a7', to: 'c2', color: '#9359FF' },
  { from: 'a7', to: 'c3', color: '#5E79FF' },
  { from: 'a9', to: 'c3', color: '#5E79FF' },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const TAG_STYLES = {
  blue: { bg: 'linear-gradient(90deg, #8ECCFF 0%, #D380FF 100%)', text: '#FFFFFF' },
  green: { bg: '#CCF4E8', text: '#00CA8E' },
}

// ─── AbilityItemRow ───────────────────────────────────────────────────────────

function AbilityItemRow({ item }: { item: AbilityItem }) {
  return (
    <div
      data-ability-id={item.id}
      className={`
        flex items-center justify-between px-5 py-4 rounded-xl
        transition-all duration-200 cursor-pointer
        ${item.matched
          ? 'bg-white hover:bg-gray-50'
          : 'bg-white hover:bg-red-50/50'
        }
      `}
    >
      <span className="text-[#1D2129] text-lg">{item.text}</span>
      {item.matched ? (
        <CheckCircle2 className="w-6 h-6 shrink-0 ml-4" fill="#CCF4E8" stroke="#22AD5C" />
      ) : (
        <CircleAlert className="w-6 h-6 shrink-0 ml-4" fill="none" stroke="#F23030" />
      )}
    </div>
  )
}

// ─── AbilityPanel ─────────────────────────────────────────────────────────────

function AbilityPanel({ groups }: { groups: AbilityGroup[] }) {
  return (
    <div className="flex-1 flex flex-col rounded-xl p-10 gap-10"
      style={{ background: 'rgba(17, 59, 143, 0.03)' }}>
      {/* Header */}
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-[#0D0D0D]" />
          </div>
          <h2 className="text-[32px] font-black text-[#0D0D0D] leading-tight">岗位能力</h2>
        </div>
        <p className="text-[#1D2129] text-xl">
          当前共362条岗位能力，已匹配能力50条，未匹配能力45条。
        </p>
      </div>

      {/* Ability Groups */}
      <div className="flex flex-col gap-10 flex-1">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-4">
            <h3 className="text-[#1D2129] text-[28px] font-bold">{group.title}</h3>
            <div className="flex flex-col gap-4">
              {group.items.map((item) => (
                <AbilityItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CourseCard ───────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const tagStyle = TAG_STYLES[course.tagColor]

  return (
    <div
      data-course-id={course.id}
      className={`
        flex flex-col gap-3 p-4 rounded-2xl transition-all duration-200 cursor-pointer
        ${course.highlighted
          ? 'border-[3px] border-[rgba(94,121,255,0.2)]'
          : 'border border-transparent'
        }
        bg-white hover:shadow-md
      `}
    >
      {/* Tag + Title row */}
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 px-2 h-8 flex items-center justify-center rounded-lg text-[18px] leading-none"
          style={{ background: tagStyle.bg, color: tagStyle.text }}
        >
          {course.tag === '智慧课程' && <BookOpen className="w-4 h-4 mr-1.5" />}
          {course.tag}
        </div>
        <span className="text-black text-[18px] font-black leading-[150%] font-serif">
          {course.name}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {[
            { label: '学分', value: course.credits },
            { label: '学期', value: course.semester },
            { label: '学时', value: course.hours },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center gap-2">
              {i > 0 && (
                <div className="w-px h-4 bg-[#E5E6EB]" />
              )}
              <span className="text-[#86909C] text-[18px]">{item.label}</span>
              <span className="text-[#86909C] text-xl font-medium font-[Poppins]">{item.value}</span>
            </div>
          ))}
        </div>
        <span className="text-[#86909C] text-[18px]">{course.major}</span>
      </div>
    </div>
  )
}

// ─── D3 Connection Lines ──────────────────────────────────────────────────────

function D3ConnectionLines({
  containerRef,
  connectionData,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  connectionData: Connection[]
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  const draw = useCallback(() => {
    const container = containerRef.current
    const svg = svgRef.current
    if (!container || !svg) return

    const containerRect = container.getBoundingClientRect()
    const svgSel = d3.select(svg)

    svgSel.attr('width', containerRect.width).attr('height', containerRect.height)

    // Update gradient coordinates
    svgSel.select('#conn-gradient')
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', String(containerRect.width)).attr('y2', '0')

    const linesGroup = svgSel.select<SVGGElement>('.lines-group')
    linesGroup.selectAll('*').remove()

    connectionData.forEach((conn, index) => {
      const fromEl = container.querySelector(`[data-ability-id="${conn.from}"]`)
      const toEl = container.querySelector(`[data-course-id="${conn.to}"]`)
      if (!fromEl || !toEl) return

      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()

      const x1 = fromRect.right - containerRect.left
      const y1 = fromRect.top + fromRect.height / 2 - containerRect.top
      const x2 = toRect.left - containerRect.left
      const y2 = toRect.top + toRect.height / 2 - containerRect.top

      const midX = (x1 + x2) / 2

      const pathData = `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`

      // Base semi-transparent line
      linesGroup.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', `url(#conn-gradient)`)
        .attr('stroke-width', 2)
        .attr('opacity', 0.3)

      // Animated flowing dashed line on top
      linesGroup.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', `url(#conn-gradient)`)
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '8 8')
        .attr('opacity', 0.85)
        .attr('class', 'flowing-conn-line')
        .style('animation-delay', `${index * 0.18}s`)
    })
  }, [containerRef, connectionData])

  useEffect(() => {
    // Small delay to ensure DOM has rendered with correct positions
    const timer = setTimeout(draw, 100)

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(draw)
    })
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    window.addEventListener('resize', draw)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('resize', draw)
    }
  }, [draw, containerRef])

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="conn-gradient" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5E79FF" />
          <stop offset="50%" stopColor="#9359FF" />
          <stop offset="100%" stopColor="#5E79FF" />
        </linearGradient>
      </defs>
      <g className="lines-group" />
    </svg>
  )
}

// ─── Main AbilityMap Component ────────────────────────────────────────────────

export default function AbilityMap() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative flex gap-16 xl:gap-[120px] p-6 xl:p-10 rounded-3xl bg-white"
    >
      {/* Left: Ability Panel */}
      <AbilityPanel groups={abilityGroups} />

      {/* Right: Course Panel */}
      <div className="flex-1 flex flex-col rounded-xl p-10 gap-[60px]"
        style={{
          background: `linear-gradient(180deg, rgba(147,89,255,0.15) 0%, rgba(147,89,255,0) 18%), #F7F9FB`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#0D0D0D]" />
          </div>
          <h2 className="text-[32px] font-black text-[#0D0D0D] leading-tight">关联课程</h2>
        </div>

        {/* Course List */}
        <div className="flex flex-col gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>

      {/* D3 SVG Connection Lines Overlay */}
      <D3ConnectionLines containerRef={containerRef} connectionData={connections} />

      {/* Flowing animation style */}
      <style jsx>{`
        :global(.flowing-conn-line) {
          animation: flowDash 0.8s linear infinite;
        }
        @keyframes flowDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -16; }
        }
      `}</style>
    </div>
  )
}
