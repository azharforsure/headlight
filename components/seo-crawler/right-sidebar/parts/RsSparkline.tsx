import React from 'react'

export function RsSparkline({
    values, width = 120, height = 24, stroke = '#F5364E', fill = 'rgba(245,54,78,0.12)',
}: {
    values: number[]
    width?: number
    height?: number
    stroke?: string
    fill?: string
}) {
    if (!values || values.length < 2) return <div className="h-[18px]" />
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const stepX = width / (values.length - 1)
    const points = values.map((v, i) => {
        const x = i * stepX
        const y = height - ((v - min) / range) * (height - 4) - 2
        return `${x},${y}`
    })
    const pathLine = `M ${points.join(' L ')}`
    const pathArea = `${pathLine} L ${width},${height} L 0,${height} Z`
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
            <path d={pathArea} fill={fill} />
            <path d={pathLine} stroke={stroke} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
