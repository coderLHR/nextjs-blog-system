'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'

export interface Course {
  id: string
  name: string
  day: number
  startHour: number
  startMinute: number
  duration: number
  location: string
  color: string
  teacher?: string
}

export interface CourseConflict {
  courseA: Course
  courseB: Course
  overlapMinutes: number
}

/** 检测两门课程是否时间冲突 */
function hasTimeOverlap(a: Course, b: Course): number {
  if (a.day !== b.day) return 0
  const aStart = a.startHour * 60 + a.startMinute
  const aEnd = aStart + a.duration * 60
  const bStart = b.startHour * 60 + b.startMinute
  const bEnd = bStart + b.duration * 60
  const overlap = Math.min(aEnd, bEnd) - Math.max(aStart, bStart)
  return overlap > 0 ? overlap : 0
}

/** 检测所有课程冲突 */
export function detectConflicts(courses: Course[]): CourseConflict[] {
  const conflicts: CourseConflict[] = []
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const overlap = hasTimeOverlap(courses[i], courses[j])
      if (overlap > 0) {
        conflicts.push({ courseA: courses[i], courseB: courses[j], overlapMinutes: overlap })
      }
    }
  }
  return conflicts
}

/** 获取所有有冲突的课程 ID 集合 */
export function getConflictIds(conflicts: CourseConflict[]): Set<string> {
  const ids = new Set<string>()
  conflicts.forEach(c => { ids.add(c.courseA.id); ids.add(c.courseB.id) })
  return ids
}

/** 检测一个课程（表单数据）与已有课程的冲突 */
export function detectConflictsFor(
  draft: { day: number; startHour: number; startMinute: number; duration: number },
  courses: Course[],
  excludeId?: string
): Course[] {
  return courses.filter(c => {
    if (excludeId && c.id === excludeId) return false
    return hasTimeOverlap(
      { ...c, id: c.id },
      { ...draft, id: '__draft__', name: '', location: '', color: '' } as Course
    ) > 0
  })
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const DAY_LABELS = DAYS
const START_HOUR = 7
const END_HOUR = 22
const HOUR_HEIGHT = 72
const HEADER_HEIGHT = 56
const TIME_COL_WIDTH = 52
const GAP = 3

// iOS-style dopamine colors - more refined, lower saturation
export const DOPAMINE_COLORS = [
  { name: '珊瑚粉', value: '#FF6B8A', bg: 'rgba(255,107,138,0.12)', border: 'rgba(255,107,138,0.35)', text: '#D44A6A' },
  { name: '天空蓝', value: '#5AC8FA', bg: 'rgba(90,200,250,0.12)', border: 'rgba(90,200,250,0.35)', text: '#2A8BC4' },
  { name: '薰衣紫', value: '#BF5AF2', bg: 'rgba(191,90,242,0.12)', border: 'rgba(191,90,242,0.35)', text: '#8E3DBF' },
  { name: '薄荷绿', value: '#34C759', bg: 'rgba(52,199,89,0.12)', border: 'rgba(52,199,89,0.35)', text: '#1E8A3A' },
  { name: '活力橙', value: '#FF9500', bg: 'rgba(255,149,0,0.12)', border: 'rgba(255,149,0,0.35)', text: '#C47200' },
  { name: '海青色', value: '#32ADE6', bg: 'rgba(50,173,230,0.12)', border: 'rgba(50,173,230,0.35)', text: '#1A7BA8' },
  { name: '玫瑰红', value: '#FF375F', bg: 'rgba(255,55,95,0.12)', border: 'rgba(255,55,95,0.35)', text: '#C42A47' },
  { name: '青柠绿', value: '#A3E048', bg: 'rgba(163,224,72,0.12)', border: 'rgba(163,224,72,0.35)', text: '#6EA32E' },
  { name: '淡紫粉', value: '#DA70D6', bg: 'rgba(218,112,214,0.12)', border: 'rgba(218,112,214,0.35)', text: '#A0509C' },
  { name: '暖黄色', value: '#FFD60A', bg: 'rgba(255,214,10,0.12)', border: 'rgba(255,214,10,0.35)', text: '#B89800' },
]

const DEFAULT_COURSES: Course[] = [
  { id: '1', name: '高等数学', day: 0, startHour: 8, startMinute: 0, duration: 2, location: 'A-101', color: '#FF6B8A' },
  { id: '2', name: '大学英语', day: 0, startHour: 10, startMinute: 0, duration: 1.5, location: 'B-203', color: '#5AC8FA' },
  { id: '3', name: '数据结构', day: 1, startHour: 14, startMinute: 0, duration: 2, location: 'C-305', color: '#BF5AF2' },
  { id: '4', name: '计算机网络', day: 2, startHour: 9, startMinute: 0, duration: 2, location: 'A-102', color: '#34C759' },
  { id: '5', name: '操作系统', day: 3, startHour: 8, startMinute: 0, duration: 2, location: 'B-201', color: '#FF9500' },
  { id: '6', name: '机器学习', day: 4, startHour: 13, startMinute: 30, duration: 2.5, location: 'C-401', color: '#32ADE6' },
]

function loadCourses(): Course[] {
  if (typeof window === 'undefined') return DEFAULT_COURSES
  try {
    const saved = localStorage.getItem('schedule-courses-v2')
    return saved ? JSON.parse(saved) : DEFAULT_COURSES
  } catch {
    return DEFAULT_COURSES
  }
}

function saveCourses(courses: Course[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('schedule-courses-v2', JSON.stringify(courses))
}

interface D3ScheduleProps {
  courses: Course[]
  conflictIds: Set<string>
  onEditCourse: (course: Course) => void
  onAddCourse: (day: number, hour: number) => void
}

export function D3Schedule({ courses, conflictIds, onEditCourse, onAddCourse }: D3ScheduleProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [now, setNow] = useState(() => new Date())

  // Real-time clock update every 30s
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        setDimensions({ width: w, height: (END_HOUR - START_HOUR) * HOUR_HEIGHT + HEADER_HEIGHT })
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const totalWidth = dimensions.width
    const totalHeight = dimensions.height
    const availableWidth = totalWidth - TIME_COL_WIDTH
    const dayW = Math.max(90, (availableWidth - GAP * (DAYS.length - 1)) / DAYS.length)

    svg.attr('width', totalWidth).attr('height', totalHeight)

    const g = svg.append('g')

    // === HEADER ===
    // Header rounded background
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', totalWidth)
      .attr('height', HEADER_HEIGHT)
      .attr('fill', 'var(--card)')
      .attr('rx', 0)

    // Time column header
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', TIME_COL_WIDTH)
      .attr('height', HEADER_HEIGHT)
      .attr('fill', 'var(--card)')

    g.append('text')
      .attr('x', TIME_COL_WIDTH / 2)
      .attr('y', HEADER_HEIGHT / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--muted-foreground)')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.05em')
      .text('时间')

    // Day headers with refined styling
    DAYS.forEach((day, i) => {
      const x = TIME_COL_WIDTH + i * (dayW + GAP)
      const isWeekend = i >= 5
      const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)

      // Day cell background
      g.append('rect')
        .attr('x', x)
        .attr('y', 0)
        .attr('width', dayW)
        .attr('height', HEADER_HEIGHT)
        .attr('fill', isToday ? 'rgba(0,113,227,0.06)' : 'var(--card)')

      // Today indicator dot
      if (isToday) {
        g.append('circle')
          .attr('cx', x + dayW / 2)
          .attr('cy', 14)
          .attr('r', 2.5)
          .attr('fill', '#0071e3')
      }

      // Day name
      g.append('text')
        .attr('x', x + dayW / 2)
        .attr('y', isToday ? 32 : HEADER_HEIGHT / 2 + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', isToday ? '#0071e3' : isWeekend ? '#FF6B8A' : 'var(--foreground)')
        .attr('font-size', '13px')
        .attr('font-weight', isToday ? '700' : '600')
        .text(day)
    })

    // Bottom border of header
    g.append('line')
      .attr('x1', 0)
      .attr('y1', HEADER_HEIGHT - 0.5)
      .attr('x2', totalWidth)
      .attr('y2', HEADER_HEIGHT - 0.5)
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 1)

    // === TIME LABELS & GRID ===
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const y = HEADER_HEIGHT + (h - START_HOUR) * HOUR_HEIGHT

      // Time label
      g.append('text')
        .attr('x', TIME_COL_WIDTH - 10)
        .attr('y', y + 3)
        .attr('text-anchor', 'end')
        .attr('fill', 'var(--muted-foreground)')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .text(`${h.toString().padStart(2, '0')}:00`)

      if (h < END_HOUR) {
        // Hour grid line
        g.append('line')
          .attr('x1', TIME_COL_WIDTH)
          .attr('y1', y)
          .attr('x2', totalWidth)
          .attr('y2', y)
          .attr('stroke', 'var(--border)')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.6)

        // Half-hour dotted line (very subtle)
        g.append('line')
          .attr('x1', TIME_COL_WIDTH)
          .attr('y1', y + HOUR_HEIGHT / 2)
          .attr('x2', totalWidth)
          .attr('y2', y + HOUR_HEIGHT / 2)
          .attr('stroke', 'var(--border)')
          .attr('stroke-width', 0.3)
          .attr('stroke-dasharray', '3,6')
          .attr('opacity', 0.3)
      }
    }

    // Vertical day separators
    for (let i = 0; i <= DAYS.length; i++) {
      const x = TIME_COL_WIDTH + i * (dayW + GAP)
      g.append('line')
        .attr('x1', x)
        .attr('y1', HEADER_HEIGHT)
        .attr('x2', x)
        .attr('y2', totalHeight)
        .attr('stroke', 'var(--border)')
        .attr('stroke-width', 0.5)
        .attr('opacity', i === 0 ? 0.8 : 0.3)
    }

    // === CLICKABLE CELLS ===
    const cellGroup = g.append('g').attr('class', 'cells')
    DAYS.forEach((_, dayIdx) => {
      for (let h = START_HOUR; h < END_HOUR; h++) {
        const x = TIME_COL_WIDTH + dayIdx * (dayW + GAP)
        const y = HEADER_HEIGHT + (h - START_HOUR) * HOUR_HEIGHT

        cellGroup.append('rect')
          .attr('x', x + 1)
          .attr('y', y + 1)
          .attr('width', dayW - 2)
          .attr('height', HOUR_HEIGHT - 2)
          .attr('fill', 'transparent')
          .attr('cursor', 'pointer')
          .attr('rx', 4)
          .on('click', function (event) {
            event.stopPropagation()
            onAddCourse(dayIdx, h)
          })
          .on('mouseenter', function () {
            d3.select(this)
              .transition().duration(120)
              .attr('fill', 'var(--accent)')
              .attr('opacity', 0.5)
          })
          .on('mouseleave', function () {
            d3.select(this)
              .transition().duration(120)
              .attr('fill', 'transparent')
              .attr('opacity', 1)
          })
      }
    })

    // === COURSES ===
    const courseGroup = g.append('g').attr('class', 'courses')

    courses.forEach((course) => {
      const x = TIME_COL_WIDTH + course.day * (dayW + GAP) + 3
      const startDecimal = course.startHour + course.startMinute / 60
      const y = HEADER_HEIGHT + (startDecimal - START_HOUR) * HOUR_HEIGHT + 2
      const h = course.duration * HOUR_HEIGHT - 4
      const w = dayW - 6

      const colorInfo = DOPAMINE_COLORS.find((c) => c.value === course.color) || DOPAMINE_COLORS[0]

      const courseG = courseGroup.append('g')
        .attr('class', 'course')
        .attr('cursor', 'pointer')
        .style('transition', 'none')
        .on('click', function (event) {
          event.stopPropagation()
          onEditCourse(course)
        })

      const isConflict = conflictIds.has(course.id)

      // Soft shadow (using a blurred rect behind)
      courseG.append('rect')
        .attr('x', x + 1)
        .attr('y', y + 2)
        .attr('width', w)
        .attr('height', h)
        .attr('rx', 10)
        .attr('fill', isConflict ? '#FF375F' : colorInfo.value)
        .attr('opacity', isConflict ? 0.12 : 0.08)

      // Main card background
      const mainRect = courseG.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', w)
        .attr('height', h)
        .attr('rx', 10)
        .attr('fill', colorInfo.bg)
        .attr('stroke', isConflict ? '#FF375F' : colorInfo.border)
        .attr('stroke-width', isConflict ? 1.5 : 1)
        .attr('stroke-dasharray', isConflict ? '4,3' : 'none')

      // Left accent bar
      courseG.append('rect')
        .attr('x', x + 3)
        .attr('y', y + 6)
        .attr('width', 3)
        .attr('height', h - 12)
        .attr('rx', 2)
        .attr('fill', colorInfo.value)

      // Course name (always show if height > 20)
      if (h > 20) {
        courseG.append('text')
          .attr('x', x + 12)
          .attr('y', y + 18)
          .attr('fill', colorInfo.text)
          .attr('font-size', '12px')
          .attr('font-weight', '700')
          .attr('letter-spacing', '-0.01em')
          .text(course.name)
      }

      // Location
      if (h > 36) {
        courseG.append('text')
          .attr('x', x + 12)
          .attr('y', y + 33)
          .attr('fill', 'var(--muted-foreground)')
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .text(course.location)
      }

      // Time range
      if (h > 50) {
        const startStr = `${course.startHour.toString().padStart(2, '0')}:${course.startMinute.toString().padStart(2, '0')}`
        const endDecimal = course.startHour + course.startMinute / 60 + course.duration
        const endH = Math.floor(endDecimal)
        const endM = Math.round((endDecimal - endH) * 60)
        const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`

        courseG.append('text')
          .attr('x', x + 12)
          .attr('y', y + 47)
          .attr('fill', 'var(--muted-foreground)')
          .attr('font-size', '9px')
          .attr('font-weight', '500')
          .attr('opacity', 0.7)
          .text(`${startStr} - ${endStr}`)
      }

      // Conflict warning icon
      if (isConflict && h > 20) {
        const iconG = courseG.append('g').attr('transform', `translate(${x + w - 18}, ${y + 6})`)
        iconG.append('circle').attr('r', 7).attr('cx', 7).attr('cy', 7).attr('fill', '#FF375F').attr('opacity', 0.15)
        iconG.append('text')
          .attr('x', 7).attr('y', 11)
          .attr('text-anchor', 'middle')
          .attr('fill', '#FF375F')
          .attr('font-size', '10px')
          .attr('font-weight', '800')
          .text('!')
      }

      // Teacher (if available)
      if (course.teacher && h > 62) {
        courseG.append('text')
          .attr('x', x + 12)
          .attr('y', y + 60)
          .attr('fill', 'var(--muted-foreground)')
          .attr('font-size', '9px')
          .attr('font-weight', '500')
          .attr('opacity', 0.6)
          .text(course.teacher)
      }

      // Hover interaction
      courseG
        .on('mouseenter', function () {
          d3.select(this).select('rect:nth-child(2)')
            .transition().duration(150)
            .attr('fill', colorInfo.value)
            .attr('fill-opacity', 0.15)
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.6)
        })
        .on('mouseleave', function () {
          d3.select(this).select('rect:nth-child(2)')
            .transition().duration(150)
            .attr('fill', colorInfo.bg)
            .attr('fill-opacity', 1)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 1)
        })
    })

    // === CURRENT TIME INDICATOR ===
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1
    const currentHour = now.getHours() + now.getMinutes() / 60

    if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
      const y = HEADER_HEIGHT + (currentHour - START_HOUR) * HOUR_HEIGHT

      // Line with glow effect
      g.append('line')
        .attr('x1', TIME_COL_WIDTH)
        .attr('y1', y)
        .attr('x2', totalWidth)
        .attr('y2', y)
        .attr('stroke', '#FF375F')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.7)

      // Dot on the current day column
      const dayX = TIME_COL_WIDTH + currentDay * (dayW + GAP) + dayW / 2
      g.append('circle')
        .attr('cx', dayX)
        .attr('cy', y)
        .attr('r', 4.5)
        .attr('fill', '#FF375F')
        .attr('stroke', 'var(--card)')
        .attr('stroke-width', 2)

      // Small "现在" label
      g.append('text')
        .attr('x', TIME_COL_WIDTH - 6)
        .attr('y', y - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#FF375F')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .text('现在')
    }

  }, [dimensions, courses, conflictIds, onEditCourse, onAddCourse, now])

  return (
    <div ref={containerRef} className="w-full overflow-x-auto rounded-2xl bg-card"
      style={{ boxShadow: 'var(--ios-shadow)' }}>
      <svg ref={svgRef} style={{ minWidth: 880, display: 'block' }} />
    </div>
  )
}

export function useScheduleCourses() {
  const [courses, setCourses] = useState<Course[]>(loadCourses)

  const addCourse = useCallback((course: Omit<Course, 'id'>) => {
    const newCourse = { ...course, id: Date.now().toString() }
    setCourses((prev) => {
      const updated = [...prev, newCourse]
      saveCourses(updated)
      return updated
    })
    return newCourse
  }, [])

  const updateCourse = useCallback((course: Course) => {
    setCourses((prev) => {
      const updated = prev.map((c) => (c.id === course.id ? course : c))
      saveCourses(updated)
      return updated
    })
  }, [])

  const deleteCourse = useCallback((id: string) => {
    setCourses((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      saveCourses(updated)
      return updated
    })
  }, [])

  const resetCourses = useCallback(() => {
    setCourses(DEFAULT_COURSES)
    saveCourses(DEFAULT_COURSES)
  }, [])

  return { courses, addCourse, updateCourse, deleteCourse, resetCourses }
}
