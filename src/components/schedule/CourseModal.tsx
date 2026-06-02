'use client'

import { useState, useMemo } from 'react'
import { X, Clock, MapPin, User, BookOpen, Palette, Trash2, AlertTriangle } from 'lucide-react'
import { DOPAMINE_COLORS, DAY_LABELS, detectConflictsFor, type Course } from './D3Schedule'

interface CourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (course: Course | Omit<Course, 'id'>) => void
  onDelete?: (id: string) => void
  initialCourse?: Course | null
  defaultDay?: number
  defaultHour?: number
  allCourses?: Course[]
}

export function CourseModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialCourse,
  defaultDay = 0,
  defaultHour = 8,
  allCourses = [],
}: CourseModalProps) {
  if (!isOpen) return null

  const isEditing = !!initialCourse

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      {/* key 控制表单组件挂载/卸载，每次打开时状态自动重置 */}
      <CourseForm
        key={initialCourse?.id || `new-${defaultDay}-${defaultHour}`}
        initialCourse={initialCourse}
        defaultDay={defaultDay}
        defaultHour={defaultHour}
        allCourses={allCourses}
        isEditing={isEditing}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  )
}

function CourseForm({
  initialCourse,
  defaultDay,
  defaultHour,
  allCourses,
  isEditing,
  onClose,
  onSave,
  onDelete,
}: {
  initialCourse?: Course | null
  defaultDay: number
  defaultHour: number
  allCourses: Course[]
  isEditing: boolean
  onClose: () => void
  onSave: (course: Course | Omit<Course, 'id'>) => void
  onDelete?: (id: string) => void
}) {
  const [name, setName] = useState(initialCourse?.name ?? '')
  const [day, setDay] = useState(initialCourse?.day ?? defaultDay)
  const [startHour, setStartHour] = useState(initialCourse?.startHour ?? defaultHour)
  const [startMinute, setStartMinute] = useState(initialCourse?.startMinute ?? 0)
  const [duration, setDuration] = useState(initialCourse?.duration ?? 2)
  const [location, setLocation] = useState(initialCourse?.location ?? '')
  const [teacher, setTeacher] = useState(initialCourse?.teacher ?? '')
  const [color, setColor] = useState(
    initialCourse?.color ?? DOPAMINE_COLORS[0].value
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Real-time conflict detection
  const conflictingCourses = useMemo(() =>
    detectConflictsFor({ day, startHour, startMinute, duration }, allCourses, initialCourse?.id),
    [day, startHour, startMinute, duration, allCourses, initialCourse]
  )

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = '请输入课程名称'
    if (!location.trim()) newErrors.location = '请输入上课地点'
    if (duration <= 0) newErrors.duration = '时长必须大于0'
    if (duration > 6) newErrors.duration = '单次课程时长不能超过6小时'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const data = {
      name: name.trim(),
      day,
      startHour,
      startMinute,
      duration,
      location: location.trim(),
      teacher: teacher.trim() || undefined,
      color,
    }
    if (isEditing && initialCourse) {
      onSave({ ...data, id: initialCourse.id })
    } else {
      onSave(data)
    }
    onClose()
  }

  const handleDelete = () => {
    if (initialCourse && onDelete) {
      onDelete(initialCourse.id)
      onClose()
    }
  }

  return (
    <div className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden"
      style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          {isEditing ? '编辑课程' : '添加课程'}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="px-6 pb-6 space-y-5 max-h-[70vh] overflow-y-auto">
        {/* Name */}
        <div>
          <label className="text-sm font-semibold mb-2 block text-foreground">课程名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：高等数学"
            className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-[15px]"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.name}</p>}
        </div>

        {/* Day */}
        <div>
          <label className="text-sm font-semibold mb-2 block text-foreground">星期</label>
          <div className="grid grid-cols-7 gap-1.5">
            {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
              <button
                key={d}
                onClick={() => setDay(i)}
                className={`py-2.5 text-sm font-semibold rounded-2xl transition-all ${
                  day === i
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              开始时间
            </label>
            <div className="flex gap-2">
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="flex-1 px-3 py-3 rounded-2xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              >
                {Array.from({ length: 16 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span className="flex items-center text-muted-foreground font-medium">:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(Number(e.target.value))}
                className="flex-1 px-3 py-3 rounded-2xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block text-foreground">时长</label>
            <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-2.5">
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm font-bold w-12 text-right tabular-nums">{duration}h</span>
            </div>
            {errors.duration && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.duration}</p>}
          </div>
        </div>

        {/* Location & Teacher */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-foreground">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              上课地点
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="A-101"
              className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
            {errors.location && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.location}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              教师
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="选填"
              className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Conflict Warning */}
        {conflictingCourses.length > 0 && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-bold">时间冲突警告</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              当前时段与以下 {conflictingCourses.length} 门课程存在时间冲突：
            </p>
            <div className="space-y-1.5">
              {conflictingCourses.map(c => {
                const endH = Math.floor(c.startHour + c.startMinute / 60 + c.duration)
                const endM = Math.round((c.startHour + c.startMinute / 60 + c.duration - endH) * 60)
                return (
                  <div key={c.id} className="flex items-center gap-2 text-xs bg-background/60 rounded-xl px-3 py-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-semibold text-foreground">{c.name}</span>
                    <span className="text-muted-foreground ml-auto">
                      {DAY_LABELS[c.day]} {c.startHour.toString().padStart(2, '0')}:{c.startMinute.toString().padStart(2, '0')}-{endH.toString().padStart(2, '0')}:{endM.toString().padStart(2, '0')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Color */}
        <div>
          <label className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-foreground">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            课程颜色
          </label>
          <div className="flex flex-wrap gap-3">
            {DOPAMINE_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`group relative w-11 h-11 rounded-2xl transition-all duration-200 ${
                  color === c.value
                    ? 'ring-[3px] ring-offset-2 ring-offset-card scale-110 shadow-lg'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: c.value,
                  ['--tw-ring-color' as string]: c.value,
                }}
                title={c.name}
              >
                {color === c.value && (
                  <svg className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 pt-2 flex items-center gap-3">
        {isEditing && onDelete && (
          <button
            onClick={handleDelete}
            className="px-5 py-3 rounded-2xl text-sm font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/15 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-2xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="px-7 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-400 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
        >
          {isEditing ? '保存' : '添加'}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
