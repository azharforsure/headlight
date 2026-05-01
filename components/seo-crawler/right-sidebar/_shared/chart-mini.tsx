import React from 'react'
import type { Tone } from './types'

const toneStroke: Record<Tone, string> = {
  good: '#10b981', warn: '#f59e0b', bad: '#f43f5e', info: '#3b82f6', neutral: '#71717a',
}

export function Sparkline({ values, height = 22, tone = 'info' }: { values: number[]; height?: number; tone?: Tone }) {
  if (!values.length) return <div className="h-[22px]" />
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const w = 100
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w
    const y = height - ((v - min) / span) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={toneStroke[tone]} strokeWidth={1.5} />
    </svg>
  )
}

export function AreaSpark({ values, height = 22, tone = 'info' }: { values: number[]; height?: number; tone?: Tone }) {
  if (!values.length) return <div className="h-[22px]" />
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const w = 100
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w
    const y = height - ((v - min) / span) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  
  const areaPoints = `${points} ${w},${height} 0,${height}`
  
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={toneStroke[tone]} strokeWidth={1.5} />
      <polygon points={areaPoints} fill={toneStroke[tone]} fillOpacity={0.1} />
    </svg>
  )
}

export function Donut({ segments, size = 64 }: { segments: { value: number; tone?: Tone; label?: string }[]; size?: number }) {
  const total = Math.max(1, segments.reduce((a, s) => a + s.value, 0))
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#1a1a1a" strokeWidth={6} fill="none" />
      {segments.map((s, i) => {
        const len = (s.value/total) * c
        const dash = `${len} ${c - len}`
        const offset = -acc
        acc += len
        return (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={6}
            stroke={toneStroke[s.tone || 'neutral']} strokeDasharray={dash} strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`} />
        )
      })}
    </svg>
  )
}

export function Heatcells({ values, cols = 7 }: { values: number[]; cols?: number }) {
  const max = Math.max(1, ...values)
  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {values.map((v, i) => {
        const a = Math.max(0.08, v / max)
        return <div key={i} className="h-3 rounded-sm" style={{ background: `rgba(245, 158, 11, ${a})` }} />
      })}
    </div>
  )
}
