import React from 'react'

export function Bar({
    value, total, color = '#F5364E', height = 6,
}: { value: number; total: number; color?: string; height?: number }) {
    const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
    return (
        <div className="w-full bg-[#1a1a1a] rounded-full overflow-hidden" style={{ height }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
    )
}
