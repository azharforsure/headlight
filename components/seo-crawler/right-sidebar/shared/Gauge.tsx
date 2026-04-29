import React from 'react'
export function Gauge({ value, label, size = 96 }: { value: number; label?: string; size?: number }) {
	const pct = Math.max(0, Math.min(100, value))
	const r = size / 2 - 8
	const c = 2 * Math.PI * r
	const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#fb7185'
	return (
		<div className="flex items-center gap-3">
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
				<g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
					<circle r={r} fill="none" stroke="#1a1a1a" strokeWidth={8} />
					<circle r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
						strokeDasharray={`${(pct / 100) * c} ${c}`} />
				</g>
				<text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{Math.round(pct)}</text>
			</svg>
			{label && <div className="text-[11px] text-[#888]">{label}</div>}
		</div>
	)
}
