import React from 'react'

export function HealthGaugeBlock({ value, prev, letter, hasPrior }: {
  value: number
  prev?: number
  letter: string
  hasPrior: boolean
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const r = 36
  const c = 2 * Math.PI * r
  const off = c - (v / 100) * c
  const tone = v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center w-[88px] shrink-0">
      <div className="relative w-[80px] h-[80px]">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} stroke="#1a1a1a" strokeWidth="6" fill="none" />
          <circle
            cx="40" cy="40" r={r}
            stroke={tone} strokeWidth="6" fill="none"
            strokeDasharray={c} strokeDashoffset={off}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-[20px] font-bold tabular-nums">{v}</div>
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-[#888] mt-1">Score · {letter}</div>
      {hasPrior && prev != null && (
        <div className={`text-[10px] font-mono ${v >= prev ? 'text-emerald-400' : 'text-red-400'}`}>
          {v >= prev ? '▲' : '▼'} {Math.abs(v - prev)}
        </div>
      )}
    </div>
  )
}
