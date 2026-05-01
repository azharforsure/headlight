import React from 'react'
import { type Tone, toneToColor } from './format'

export function RsBucket({
    label, count, max, tone, hint,
}: {
    label: string
    count: number
    max: number
    tone?: Tone
    hint?: string
}) {
    const blocks = max > 0 ? Math.max(0, Math.min(10, Math.round((count / max) * 10))) : 0
    const color = toneToColor(tone)
    return (
        <div className="flex items-center justify-between gap-2 py-1">
            <span className="text-[11px] text-[#bbb] truncate w-[68px]">{label}</span>
            <div className="flex-1 flex gap-[2px]">
                {Array.from({ length: 10 }).map((_, i) => (
                    <span
                        key={i}
                        className="h-2.5 flex-1 rounded-[1px]"
                        style={{ backgroundColor: i < blocks ? color : '#1a1a1a' }}
                    />
                ))}
            </div>
            <span className="text-[11px] font-mono tabular-nums text-[#ddd] w-[42px] text-right shrink-0">
                {count.toLocaleString()}
            </span>
            {hint && <span className="text-[9px] text-[#666] shrink-0">{hint}</span>}
        </div>
    )
}
