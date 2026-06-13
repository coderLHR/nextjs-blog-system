'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown, Home, PenTool, BookOpen, CalendarDays, Workflow, Network, BarChart3, Edit, Sparkles, MessageSquare, type LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Home, PenTool, BookOpen, CalendarDays, Workflow,
  Network, BarChart3, Edit, Sparkles, MessageSquare,
}

interface NavItem {
  href: string
  icon: string
  label: string
}

interface NavLinksProps {
  items: NavItem[]
}

export function NavLinks({ items }: NavLinksProps) {
  const [visibleCount, setVisibleCount] = useState(items.length)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const calcVisible = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const parentWidth = container.parentElement?.clientWidth ?? window.innerWidth
    const available = parentWidth - 360
    const perItem = 100
    const count = Math.max(2, Math.floor(available / perItem))
    setVisibleCount(Math.min(count, items.length))
  }, [items.length])

  useEffect(() => {
    calcVisible()
    window.addEventListener('resize', calcVisible)
    return () => window.removeEventListener('resize', calcVisible)
  }, [calcVisible])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const visibleItems = items.slice(0, visibleCount)
  const overflowItems = items.slice(visibleCount)

  return (
    <div ref={containerRef} className="hidden md:flex items-center gap-1 text-sm font-medium">
      {visibleItems.map((item) => {
        const Icon = ICON_MAP[item.icon]
        if (!Icon) return null
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:bg-[var(--muted)] text-muted-foreground hover:text-foreground whitespace-nowrap flex-shrink-0"
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        )
      })}
      {overflowItems.length > 0 && (
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all text-sm ${
              dropdownOpen
                ? 'bg-[rgba(0,212,255,0.08)] text-[var(--neon-blue)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-[var(--muted)]'
            }`}
          >
            更多
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-1 min-w-[160px] py-2 rounded-xl bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[var(--ios-shadow-lg)] z-50 animate-[dropdownFadeIn_0.15s_ease]">
              {overflowItems.map((item) => {
                const Icon = ICON_MAP[item.icon]
                if (!Icon) return null
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
