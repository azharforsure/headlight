import React from 'react'
import { fmtDelta } from './format'

export function RsDelta({ curr, prev, digits = 0 }: { curr: number; prev: number; digits?: number }) {
    const { text, tone } = fmtDelta(curr, prev, digits)
    const color = tone === 'good' ? 'text-[#10b981]' : tone === 'bad' ? 'text-[#ef4444]' : 'text-[#666]'
    return <span className={`text-[10px] font-mono tabular-nums ${color}`}>{text}</span>
}
