import React from 'react'
import { clamp } from './format'

export function RsGauge({
    value, max = 100, label, sub, size = 96,
}: {
    value: number
    max?: number
    label?: string
    sub?: string
    size?: number
}) {
    const v = clamp(value, 0, max)
    const r = (size / 2) - 8
    const c = 2 * Math.PI * r
    const offset = c * (1 - v / max)
    const color = v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : v >= 40 ? '#fb923c' : '#ef4444'
    return (
        <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 block">
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    stroke="#1a1a1a" strokeWidth="6" fill="transparent"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    stroke={color} strokeWidth="6" fill="transparent"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 320ms ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-1">
                <span className="text-[20px] font-bold font-mono tabular-nums text-white leading-none">{Math.round(v)}</span>
                {label && <span className="text-[9px] uppercase tracking-widest text-[#666] mt-1">{label}</span>}
                {sub && <span className="text-[10px] text-[#444] mt-0.5">{sub}</span>}
            </div>
        </div>
    )
}
