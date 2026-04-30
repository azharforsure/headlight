import React from 'react'

export function StackedBar({
  data, segments, height = 8,
}: { 
  data?: { value: number; color: string; label?: string }[]
  segments?: { value: number; color: string; label?: string }[]
  height?: number 
}) {
  const items = data ?? segments ?? []
  const total = items.reduce((s, x) => s + x.value, 0) || 1
  
  const getColor = (c: string) => {
    if (c === 'good') return '#4ade80'
    if (c === 'info') return '#60a5fa'
    if (c === 'warn') return '#fbbf24'
    if (c === 'bad')  return '#f87171'
    return c
  }

  return (
    <div className="w-full overflow-hidden rounded-full flex bg-white/5" style={{ height }}>
      {items.map((s, i) => (
        <div 
          key={i} 
          title={s.label} 
          className="transition-all duration-500 first:rounded-l-full last:rounded-r-full"
          style={{ width: `${(s.value / total) * 100}%`, backgroundColor: getColor(s.color) }} 
        />
      ))}
    </div>
  )
}
