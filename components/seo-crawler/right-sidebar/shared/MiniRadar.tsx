import React from 'react'
export function MiniRadar({ data, size = 140 }: {
	data: { axis: string; value: number }[] // value 0..100
	size?: number
}) {
	const cx = size / 2, cy = size / 2, r = size / 2 - 18
	const step = (Math.PI * 2) / data.length
	const points = data.map((d, i) => {
		const a = -Math.PI / 2 + i * step
		const v = Math.max(0, Math.min(100, d.value)) / 100
		return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v] as const
	})
	const poly = points.map(p => p.join(',')).join(' ')
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			{[0.25, 0.5, 0.75, 1].map((f, i) => (
				<polygon
					key={i}
					points={data.map((_, j) => {
						const a = -Math.PI / 2 + j * step
						return `${cx + Math.cos(a) * r * f},${cy + Math.sin(a) * r * f}`
					}).join(' ')}
					fill="none" stroke="#222" strokeWidth={1}
				/>
			))}
			<polygon points={poly} fill="#a78bfa33" stroke="#a78bfa" strokeWidth={1.5} />
			{data.map((d, i) => {
				const a = -Math.PI / 2 + i * step
				const lx = cx + Math.cos(a) * (r + 12)
				const ly = cy + Math.sin(a) * (r + 12)
				return <text key={i} x={lx} y={ly} textAnchor="middle" fontSize="9" fill="#888" dominantBaseline="middle">{d.axis}</text>
			})}
		</svg>
	)
}
