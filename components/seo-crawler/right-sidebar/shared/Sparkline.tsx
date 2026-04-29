import React from 'react'
export function Sparkline({ data, width = 120, height = 24, color = '#60a5fa' }: {
	data: number[]
	width?: number
	height?: number
	color?: string
}) {
	if (!data.length) return null
	const max = Math.max(...data), min = Math.min(...data)
	const span = max - min || 1
	const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / span) * height}`).join(' ')
	return (
		<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
			<polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
		</svg>
	)
}
