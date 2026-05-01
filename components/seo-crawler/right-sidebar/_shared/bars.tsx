// components/seo-crawler/right-sidebar/_shared/bars.tsx
import React from 'react'
import { TONE_BG, type Tone } from './score'
import { fmtNum, safePct, cls } from './format'

export function Bar({
  value, max, tone = 'info', height = 6, label, right,
}: {
  value: number; max: number; tone?: Tone; height?: number
  label?: React.ReactNode; right?: React.ReactNode
}) {
  const pct = Math.max(0, Math.min(100, safePct(value, max)))
  return (
    <div className="space-y-1">
      {(label || right) && (
        <div className="flex items-center justify-between text-[10px] text-[#888]">
          <span className="truncate">{label}</span>
          {right ?? <span className="font-mono text-[#bbb]">{fmtNum(value)}</span>}
        </div>
      )}
      <div className="w-full bg-[#1a1a1a] rounded overflow-hidden" style={{ height }}>
        <div className={cls('h-full rounded', TONE_BG[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function BarStack({
  segments, height = 8,
}: {
  segments: Array<{ value: number; tone: Tone; label?: string }>
  height?: number
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0)
  if (total <= 0) {
    return <div className="w-full bg-[#1a1a1a] rounded" style={{ height }} />
  }
  return (
    <div className="w-full bg-[#1a1a1a] rounded overflow-hidden flex" style={{ height }}>
      {segments.map((s, i) => (
        <div
          key={i}
          className={TONE_BG[s.tone]}
          style={{ width: `${(s.value / total) * 100}%` }}
          title={s.label ? `${s.label}: ${s.value}` : `${s.value}`}
        />
      ))}
    </div>
  )
}

export function MiniSpark({
  data, tone = 'info', height = 22,
}: { data: number[]; tone?: Tone; height?: number }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = Math.max(max - min, 1)
  const w = 100
  const step = w / Math.max(data.length - 1, 1)
  const path = data
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * height
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
  const stroke =
    tone === 'good' ? '#10b981' :
    tone === 'warn' ? '#f59e0b' :
    tone === 'bad'  ? '#ef4444' :
    tone === 'info' ? '#3b82f6' : '#888'
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  )
}
