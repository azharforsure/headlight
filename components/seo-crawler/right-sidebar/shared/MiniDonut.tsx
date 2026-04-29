import React from 'react'
export function MiniDonut({ data, size = 64, thickness = 10 }: {
	data: { name: string; value: number; color: string }[]
	size?: number
	thickness?: number
}) {
	const total = data.reduce((s, d) => s + d.value, 0) || 1
	const r = (size - thickness) / 2
	const c = 2 * Math.PI * r
	let acc = 0
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
				<circle r={r} fill="none" stroke="#1a1a1a" strokeWidth={thickness} />
				{data.map((d, i) => {
					const frac = d.value / total
					const dash = `${frac * c} ${c}`
					const offset = -acc * c
					acc += frac
					return <circle key={i} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={dash} strokeDashoffset={offset} />
				})}
			</g>
		</svg>
	)
}
