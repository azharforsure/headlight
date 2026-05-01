// components/seo-crawler/right-sidebar/_shared/gauge.tsx
import React from 'react'
import { scoreToTone, TONE_TEXT } from './score'
import { cls } from './format'

export function RingGauge({
  value, size = 80, label,
}: { value: number; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  const r = size / 2 - 6
  const c = 2 * Math.PI * r
  const dash = (v / 100) * c
  const tone = scoreToTone(v)
  const stroke =
    tone === 'good' ? '#10b981' :
    tone === 'warn' ? '#f59e0b' :
    tone === 'bad'  ? '#ef4444' : '#444'
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1a1a1a" strokeWidth={6} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r}
          stroke={stroke} strokeWidth={6} fill="none" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={cls('font-mono font-bold tabular-nums leading-none', size > 90 ? 'text-2xl' : 'text-lg', TONE_TEXT[tone])}>
          {Number.isFinite(v) ? Math.round(v) : '—'}
        </span>
        {label && <span className="text-[9px] uppercase tracking-widest text-[#666] mt-1.5">{label}</span>}
      </div>
    </div>
  )
}

// Bullet bar: target marker on a 0..max scale, with three bands.
export function BulletBar({
  value, max, good, warn,
}: { value: number; max: number; good: number; warn: number }) {
  const pct = (n: number) => Math.max(0, Math.min(100, (n / max) * 100))
  return (
    <div className="relative h-2 w-full bg-[#1a1a1a] rounded overflow-hidden">
      <div className="absolute inset-y-0 left-0 bg-[#10b981]/25" style={{ width: `${pct(good)}%` }} />
      <div className="absolute inset-y-0 bg-[#f59e0b]/25"
           style={{ left: `${pct(good)}%`, width: `${pct(warn) - pct(good)}%` }} />
      <div className="absolute inset-y-0 bg-[#ef4444]/20"
           style={{ left: `${pct(warn)}%`, width: `${100 - pct(warn)}%` }} />
      <div className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-white"
           style={{ left: `${pct(value)}%` }} />
    </div>
  )
}
