import React from 'react'

export function Gauge({
  value, max = 100, size = 64, accent, label,
}: {
  value: number
  max?: number
  size?: number
  accent?: 'violet' | 'good' | 'warn' | 'bad' | 'info'
  label?: string
}) {
  const v = Math.max(0, Math.min(max, value))
  const pct = (v / max) * 100
  
  const stroke = accent === 'violet' ? '#a78bfa'
               : accent === 'good' ? '#4ade80'
               : accent === 'warn' ? '#fbbf24'
               : accent === 'bad'  ? '#f87171'
               : accent === 'info' ? '#60a5fa'
               : pct >= 80 ? '#4ade80' : pct >= 60 ? '#fbbf24' : '#f87171'

  const r = (size / 2) - 8, c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#1a1a1a" strokeWidth={size/10} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r} stroke={stroke} strokeWidth={size/10} fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text 
          x={size/2} y={size/2 + (size/10)} 
          textAnchor="middle" 
          fontSize={size/4} 
          fill="#fff" 
          fontFamily="monospace"
          className="tabular-nums font-bold"
        >
          {Math.round(v)}
        </text>
      </svg>
      {label && <div className="text-[10px] text-[#888] mt-1">{label}</div>}
    </div>
  )
}
