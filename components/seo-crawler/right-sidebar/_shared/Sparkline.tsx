import React from 'react'

export function Sparkline({
    points, width = 180, height = 32, color = '#F5364E',
}: {
    points: Array<number | null>
    width?: number
    height?: number
    color?: string
}) {
    const valid = points.map(p => (typeof p === 'number' && Number.isFinite(p) ? p : null))
    const nums = valid.filter((p): p is number => p !== null)
    if (nums.length < 2) {
        return <div className="h-[32px] flex items-center text-[10px] text-[#555]">Not enough data</div>
    }
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    const span = max - min || 1
    const stepX = width / (valid.length - 1)
    const path = valid.map((v, i) => {
        const x = i * stepX
        const y = v === null ? null : height - ((v - min) / span) * (height - 4) - 2
        return v === null ? null : `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y!.toFixed(1)}`
    }).filter(Boolean).join(' ')

    return (
        <svg width={width} height={height} className="block">
            <path d={path} stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
        </svg>
    )
}
