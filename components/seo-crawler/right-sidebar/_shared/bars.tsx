import React from 'react'
import type { Tone } from './types'

const toneBg: Record<Tone, string> = {
  good: '#10b981', warn: '#f59e0b', bad: '#f43f5e', info: '#3b82f6', neutral: '#71717a',
}

export function Bar({ value, max, tone = 'neutral', color, right }: { value: number; max: number; tone?: Tone; color?: string; right?: React.ReactNode }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 grow min-w-0">
      <div className="h-1.5 grow overflow-hidden rounded bg-[#1a1a1a]">
        <div className="h-full transition-all duration-300" 
             style={{ width: `${pct}%`, background: color ?? toneBg[tone] }} />
      </div>
      {right}
    </div>
  )
}


export function BarStack({ segments }: { segments: { value: number; tone?: Tone; label?: string }[] }) {
  const total = segments.reduce((a, s) => a + (Number(s.value) || 0), 0) || 1
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded bg-[#1a1a1a]">
        {segments.map((s, i) => (
          <div key={i} title={`${s.label}: ${s.value}`}
            style={{ width: `${(s.value/total)*100}%`, background: toneBg[s.tone || 'neutral'] }} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
        {segments.map((s, i) => (
          <span key={i} className="text-[10px] text-[#888] flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-sm"
              style={{ background: toneBg[s.tone || 'neutral'] }} />
            {s.label} {s.value}
          </span>
        ))}
      </div>
    </div>
  )
}

export function MiniBar({ value, max, tone = 'neutral' }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-[#1a1a1a]">
      <div className="h-full" style={{ width: `${pct}%`, background: toneBg[tone] }} />
    </div>
  )
}

export function Distribution({ rows }: { rows: { label: string; value: number; tone?: Tone }[] }) {
  const max = Math.max(1, ...rows.map(r => r.value))
  return (
    <div className="space-y-1">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[80px_1fr_40px] items-center gap-2">
          <span className="truncate text-[11px] text-[#bbb]">{r.label}</span>
          <MiniBar value={r.value} max={max} tone={r.tone} />
          <span className="text-right text-[10px] font-mono tabular-nums text-[#888]">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

export function RsBar({ value, max, total, label, tail, tone = 'neutral', suffix }: { 
  value: number, 
  max?: number, 
  total?: number, 
  label: React.ReactNode, 
  tail?: React.ReactNode, 
  tone?: Tone,
  suffix?: string
}) {
  const m = max ?? total ?? 100
  const t = tail ?? (suffix ? `${value}${suffix}` : value)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[#666]">
        <div className="truncate">{label}</div>
        <div className="font-mono">{t}</div>
      </div>
      <MiniBar value={value} max={m} tone={tone} />
    </div>
  )
}
