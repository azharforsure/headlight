import React from 'react'
import type { Tone } from './types'

const toneClass: Record<Tone, string> = {
  good: 'text-emerald-400',
  warn: 'text-amber-400',
  bad:  'text-rose-400',
  info: 'text-sky-400',
  neutral: 'text-[#ddd]',
}

export function KpiTile({
  label, value, sub, tone = 'neutral', delta,
}: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: Tone; delta?: string }) {
  return (
    <div className="rounded border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-[#555]">{label}</div>
      <div className={`mt-0.5 text-[16px] font-bold tabular-nums ${toneClass[tone]}`}>{value}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#666]">
        {sub}
        {delta && <span className={tone === 'bad' ? 'text-rose-400' : 'text-emerald-400'}>{delta}</span>}
      </div>
    </div>
  )
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-1.5">{children}</div>
}

export function DeltaPill({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (!Number.isFinite(value) || value === 0) return <span className="text-[#666]">—</span>
  const up = value > 0
  return (
    <span className={`text-[10px] font-mono ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}
