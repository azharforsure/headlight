// components/seo-crawler/right-sidebar/_shared/metric-row.tsx
import React from 'react'
import { TONE_TEXT, type Tone } from './score'
import { cls } from './format'

export function MetricRow({
  label, value, tone, hint,
}: {
  label: React.ReactNode
  value: React.ReactNode
  tone?: Tone
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[#141414] transition-colors">
      <span className="text-[11px] text-[#bbb] truncate" title={hint}>{label}</span>
      <span className={cls('text-[11px] font-mono tabular-nums', tone ? TONE_TEXT[tone] : 'text-white')}>
        {value}
      </span>
    </div>
  )
}

export function KpiTile({
  label, value, sub, tone, icon,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: Tone
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1c1c1c] rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-[#666]">
        <span>{label}</span>
        {icon && <span className="text-[#444]">{icon}</span>}
      </div>
      <div className={cls('text-[18px] font-mono tabular-nums mt-0.5', tone ? TONE_TEXT[tone] : 'text-white')}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-[#666] mt-0.5">{sub}</div>}
    </div>
  )
}
