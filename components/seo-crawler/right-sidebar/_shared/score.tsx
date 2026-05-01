import React from 'react'
import { scoreToTone } from './scoring'

const toneBg = { good: '#10b981', warn: '#f59e0b', bad: '#f43f5e', neutral: '#71717a' } as const

export function ScoreBreakdown({ scores }: { scores: { label: string; score: number }[] }) {
  return (
    <div className="space-y-2">
      {scores.map((s, i) => {
        const tone = scoreToTone(s.score)
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
              <span className="text-[#666]">{s.label}</span>
              <span className="font-bold tabular-nums text-white">{s.score}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-[#1a1a1a]">
              <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: toneBg[tone] }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function BulletGauge({ value, target = 90, label }: { value: number; target?: number; label?: string }) {
  const tone = scoreToTone(value)
  return (
    <div className="space-y-1">
      {label && <div className="text-[10px] uppercase tracking-widest text-[#666]">{label}</div>}
      <div className="relative h-2 w-full rounded bg-[#1a1a1a]">
        <div className="h-full rounded" style={{ width: `${value}%`, background: toneBg[tone] }} />
        <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-white" style={{ left: `${target}%` }} title={`Target: ${target}`} />
      </div>
    </div>
  )
}

export function Percentile({ value, label }: { value: number; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[16px] font-bold text-white">{value}th</div>
      <div className="text-[10px] text-[#666] uppercase tracking-widest">{label || 'Percentile'}</div>
    </div>
  )
}
