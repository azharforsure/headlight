import React from 'react'
import { clamp } from './format'

export function RsHistogram({
    bins, height = 48,
}: {
    bins: { label: string; count: number; tone?: 'good' | 'warn' | 'bad' | 'neutral' }[]
    height?: number
}) {
    const max = Math.max(...bins.map(b => b.count), 1)
    return (
        <div className="space-y-1.5">
            <div className="flex items-end gap-[3px]" style={{ height }}>
                {bins.map((b, i) => {
                    const h = clamp((b.count / max) * 100, 4, 100)
                    const color =
                        b.tone === 'good' ? '#10b981' :
                        b.tone === 'warn' ? '#f59e0b' :
                        b.tone === 'bad' ? '#ef4444' :
                        '#3b82f6'
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${b.label}: ${b.count}`}>
                            <span className="w-full rounded-t" style={{ height: `${h}%`, backgroundColor: color, opacity: 0.8 }} />
                        </div>
                    )
                })}
            </div>
            <div className="flex gap-[3px]">
                {bins.map((b, i) => (
                    <div key={i} className="flex-1 text-center text-[9px] text-[#666] truncate">{b.label}</div>
                ))}
            </div>
        </div>
    )
}
