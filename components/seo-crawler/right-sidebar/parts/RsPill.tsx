import React from 'react'
import { type Tone, toneToColor } from './format'

export function RsPill({ tone, children }: { tone?: Tone; children: React.ReactNode }) {
    const c = toneToColor(tone)
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: c, borderColor: `${c}40`, backgroundColor: `${c}14` }}
        >
            {children}
        </span>
    )
}
