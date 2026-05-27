'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

const TabsContext = createContext<{ value: string; setValue: (v: string) => void } | null>(null)

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [value, setValue] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className = '' }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be in Tabs')
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be in Tabs')
  if (ctx.value !== value) return null
  return <div className="mt-2">{children}</div>
}
