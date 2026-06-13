'use client'

import CountUp from 'react-countup'

interface StatsCounterProps {
  items: { value: number; label: string; suffix?: string }[]
}

export function StatsCounter({ items }: StatsCounterProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.label} className="stats-card">
          <div className="stats-number">
            <CountUp
              end={item.value}
              duration={2.5}
              separator=","
              suffix={item.suffix || ''}
              enableScrollSpy
            />
          </div>
          <div className="stats-label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
