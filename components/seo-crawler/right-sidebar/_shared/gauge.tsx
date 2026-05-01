import React from 'react'
import { scoreToTone } from './scoring'

const toneStroke = { good: '#10b981', warn: '#f59e0b', bad: '#f43f5e', neutral: '#666' } as const

export function RingGauge({ value, size = 88, label }: { value: number; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  const r = size / 2 - 6
  const c = 2 * Math.PI * r
  const dash = (v / 100) * c
  const tone = scoreToTone(v)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#1a1a1a" strokeWidth={6} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={toneStroke[tone]} strokeWidth={6} fill="none"
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x="50%" y="50%" textAnchor="middle" dy=".35em"
          className="fill-white text-[20px] font-bold tabular-nums">{Math.round(v)}</text>
      </svg>
      {label && <div className="text-[10px] uppercase tracking-widest text-[#666]">{label}</div>}
    </div>
  )
}

export function HalfArcGauge({ value, size = 120, label }: { value: number; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  const r = size / 2 - 10
  const c = Math.PI * r
  const dash = (v / 100) * c
  const tone = scoreToTone(v)
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M 10,${size/2} A ${r},${r} 0 0,1 ${size-10},${size/2}`}
          stroke="#1a1a1a"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 10,${size/2} A ${r},${r} 0 0,1 ${size-10},${size/2}`}
          stroke={toneStroke[tone]}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
        <text x="50%" y="85%" textAnchor="middle" className="fill-white text-[24px] font-bold tabular-nums">
          {Math.round(v)}
        </text>
      </svg>
      {label && <div className="text-[10px] uppercase tracking-widest text-[#666] mt-1">{label}</div>}
    </div>
  )
}
