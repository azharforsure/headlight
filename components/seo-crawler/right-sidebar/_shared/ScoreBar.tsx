import React from 'react'

export function ScoreBar({
  value,
  label,
  hint,
}: {
  value: number
  label?: string
  hint?: string
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const band =
    v >= 90 ? { name: 'Excellent', tone: 'good',  color: '#22c55e' } :
    v >= 75 ? { name: 'Good',      tone: 'good',  color: '#84cc16' } :
    v >= 60 ? { name: 'Fair',      tone: 'info',  color: '#f59e0b' } :
    v >= 40 ? { name: 'Poor',      tone: 'warn',  color: '#f97316' } :
              { name: 'Critical',  tone: 'bad',   color: '#F5364E' }
  const fillStyle = { width: `${v}%`, background: band.color }
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-[#888]">{label || 'Score'}</span>
        <span className="text-[11px] font-mono text-white">
          {v} <span className="text-[#666]">· {band.name}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#0d0d0d] border border-[#1a1a1a] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={fillStyle} />
      </div>
      {hint && <div className="text-[10px] text-[#666] mt-1">{hint}</div>}
    </div>
  )
}
