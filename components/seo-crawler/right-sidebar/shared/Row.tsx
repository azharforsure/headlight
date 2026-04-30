import React from 'react'

export function Row({
  label, value, hint, right, tone, bar, delta, sub, truncate,
}: {
  label: React.ReactNode
  value?: React.ReactNode
  hint?: React.ReactNode
  right?: React.ReactNode
  tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral' | 'muted'
  bar?: number
  delta?: React.ReactNode
  sub?: React.ReactNode
  truncate?: boolean
}) {
  const toneClass = tone === 'good' ? 'text-[#4ade80]'
    : tone === 'warn' ? 'text-[#fbbf24]'
    : tone === 'bad'  ? 'text-[#f87171]'
    : tone === 'info' ? 'text-[#60a5fa]'
    : tone === 'muted' ? 'text-[#666]'
    : 'text-white'

  return (
    <div className="flex flex-col py-1.5 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between">
        <div className={`text-[11px] text-[#bbb] min-w-0 flex-1 ${truncate ? 'truncate' : ''}`}>
          {label}
        </div>
        {right ?? (
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {delta && <span className="text-[10px] tabular-nums">{delta}</span>}
            <div className={`text-[11px] font-mono tabular-nums ${toneClass}`}>
              {value ?? '—'}
            </div>
          </div>
        )}
      </div>
      {hint && <div className="text-[10px] text-[#666] truncate">{hint}</div>}
      {sub && <div className="text-[10px] text-[#666] truncate mt-0.5">{sub}</div>}
      {bar != null && (
        <div className="h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              tone === 'good' ? 'bg-[#4ade80]' : tone === 'warn' ? 'bg-[#fbbf24]' : tone === 'bad' ? 'bg-[#f87171]' : 'bg-[#60a5fa]'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
          />
        </div>
      )}
    </div>
  )
}
