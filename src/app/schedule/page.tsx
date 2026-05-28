'use client'

import { useState, useCallback, useMemo } from 'react'
import { Calendar, Plus, RotateCcw, Sparkles, BookOpen, Clock, CalendarCheck, AlertTriangle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { D3Schedule, useScheduleCourses, detectConflicts, getConflictIds, DAY_LABELS, DOPAMINE_COLORS, type Course, type CourseConflict } from '@/components/schedule/D3Schedule'
import { CourseModal } from '@/components/schedule/CourseModal'

export default function SchedulePage() {
  const { courses, addCourse, updateCourse, deleteCourse, resetCourses } = useScheduleCourses()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [defaultDay, setDefaultDay] = useState(0)
  const [defaultHour, setDefaultHour] = useState(8)
  const [showConflictPanel, setShowConflictPanel] = useState(false)

  const handleEditCourse = useCallback((course: Course) => {
    setEditingCourse(course)
    setModalOpen(true)
  }, [])

  const handleAddCourse = useCallback((day: number, hour: number) => {
    setEditingCourse(null)
    setDefaultDay(day)
    setDefaultHour(hour)
    setModalOpen(true)
  }, [])

  const handleSave = useCallback((course: Course | Omit<Course, 'id'>) => {
    if ('id' in course) {
      updateCourse(course as Course)
    } else {
      addCourse(course)
    }
  }, [addCourse, updateCourse])

  const handleDelete = useCallback((id: string) => {
    deleteCourse(id)
  }, [deleteCourse])

  const handleReset = useCallback(() => {
    if (confirm('确定要重置为默认课程表吗？当前所有自定义课程将丢失。')) {
      resetCourses()
    }
  }, [resetCourses])

  // Conflict detection
  const conflicts = useMemo(() => detectConflicts(courses), [courses])
  const conflictIds = useMemo(() => getConflictIds(conflicts), [conflicts])

  // Stats
  const courseCount = courses.length
  const weekHours = courses.reduce((sum, c) => sum + c.duration, 0)
  const todayDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const todayCourses = courses.filter(c => c.day === todayDay)

  // Dynamic legend: unique courses with their colors
  const legendItems = useMemo(() => {
    const seen = new Map<string, string>()
    courses.forEach(c => {
      if (!seen.has(c.name)) {
        const colorInfo = DOPAMINE_COLORS.find(d => d.value === c.color)
        seen.set(c.name, colorInfo?.value || c.color)
      }
    })
    return Array.from(seen.entries())
  }, [courses])

  return (
    <div className="container py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Schedule</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">我的课程表</h1>
          <p className="text-muted-foreground mt-1.5 text-[15px] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            点击空白处添加课程，点击课程块进行编辑
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 transition-all active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </button>
          <button
            onClick={() => {
              setEditingCourse(null)
              setDefaultDay(0)
              setDefaultHour(8)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-400 hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            添加课程
          </button>
        </div>
      </div>

      {/* Stats Cards - iOS style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="本周课程"
          value={courseCount}
          unit="门"
          gradient="from-rose-400/20 to-orange-400/20"
          iconBg="bg-rose-500/15"
          iconColor="text-rose-500"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="总课时"
          value={weekHours}
          unit="小时"
          gradient="from-blue-400/20 to-cyan-400/20"
          iconBg="bg-blue-500/15"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="日均课时"
          value={Number((weekHours / 7).toFixed(1))}
          unit="小时"
          gradient="from-emerald-400/20 to-teal-400/20"
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={<CalendarCheck className="h-4 w-4" />}
          label="今日课程"
          value={todayCourses.length}
          unit="门"
          gradient="from-violet-400/20 to-purple-400/20"
          iconBg="bg-violet-500/15"
          iconColor="text-violet-500"
        />
      </div>

      {/* Conflict Alert Banner */}
      {conflicts.length > 0 && (
        <button
          onClick={() => setShowConflictPanel(!showConflictPanel)}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors text-left"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              检测到 {conflicts.length} 处时间冲突
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              涉及 {conflictIds.size} 门课程，点击查看详情
            </span>
          </div>
          {showConflictPanel
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </button>
      )}

      {/* Conflict Detail Panel */}
      {showConflictPanel && conflicts.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden" style={{ boxShadow: 'var(--ios-shadow)' }}>
          <div className="px-5 py-4 border-b border-border/40">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              冲突详情
            </h3>
          </div>
          <div className="divide-y divide-border/30">
            {conflicts.map((conflict, idx) => (
              <ConflictItem
                key={idx}
                conflict={conflict}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold tracking-tight">课程安排</h2>
          <span className="text-xs text-muted-foreground font-medium">7:00 - 22:00</span>
        </div>
        <D3Schedule
          courses={courses}
          conflictIds={conflictIds}
          onEditCourse={handleEditCourse}
          onAddCourse={handleAddCourse}
        />
      </div>

      {/* Dynamic Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">图例</span>
        {legendItems.map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground font-medium">{name}</span>
          </div>
        ))}
        {conflicts.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-red-400" />
            <span className="text-xs text-red-400 font-medium">冲突</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-4 h-0.5 rounded-full" style={{ background: 'repeating-linear-gradient(90deg, #FF375F, #FF375F 3px, transparent 3px, transparent 6px)' }} />
          <span className="text-xs text-muted-foreground font-medium">当前时间</span>
        </div>
      </div>

      {/* Modal */}
      <CourseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialCourse={editingCourse}
        defaultDay={defaultDay}
        defaultHour={defaultHour}
        allCourses={courses}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  unit,
  gradient,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  gradient: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 border border-border/60`}
      style={{ backgroundColor: 'var(--card)' }}>
      <div className="relative z-10">
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center mb-3 ${iconColor}`}>
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-bold tracking-tight">
          {value}
          <span className="text-sm font-medium text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
    </div>
  )
}

function formatTime(c: Course) {
  const startStr = `${c.startHour.toString().padStart(2, '0')}:${c.startMinute.toString().padStart(2, '0')}`
  const endDecimal = c.startHour + c.startMinute / 60 + c.duration
  const endH = Math.floor(endDecimal)
  const endM = Math.round((endDecimal - endH) * 60)
  return `${startStr} - ${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
}

function ConflictItem({ conflict, onDelete }: { conflict: CourseConflict; onDelete: (id: string) => void }) {
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="text-xs text-muted-foreground font-medium">
        {DAY_LABELS[conflict.courseA.day]} · 重叠 {conflict.overlapMinutes} 分钟
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Course A */}
        <div className="flex-1 flex items-center gap-3 bg-background/60 rounded-xl px-3 py-2.5">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: conflict.courseA.color }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{conflict.courseA.name}</p>
            <p className="text-xs text-muted-foreground">{formatTime(conflict.courseA)} · {conflict.courseA.location}</p>
          </div>
          <button
            onClick={() => onDelete(conflict.courseA.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
            title={`删除 ${conflict.courseA.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Course B */}
        <div className="flex-1 flex items-center gap-3 bg-background/60 rounded-xl px-3 py-2.5">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: conflict.courseB.color }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{conflict.courseB.name}</p>
            <p className="text-xs text-muted-foreground">{formatTime(conflict.courseB)} · {conflict.courseB.location}</p>
          </div>
          <button
            onClick={() => onDelete(conflict.courseB.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
            title={`删除 ${conflict.courseB.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
