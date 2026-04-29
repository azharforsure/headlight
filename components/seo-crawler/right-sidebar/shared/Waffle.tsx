import React from 'react'
export function Waffle({ value, color = '#a78bfa', size = 80 }: { value: number; color?: string; size?: number }) {
	const pct = Math.max(0, Math.min(100, Math.round(value)))
	const cell = size / 10
	return (
		<div className="grid grid-cols-10 gap-[2px]" style={ { width: size, height: size } }>
			{Array.from({ length: 100 }).map((_, i) => (
				<div key={i} style={ { width: cell - 2, height: cell - 2, background: i < pct ? color : '#1a1a1a' } } />
			))}
		</div>
	)
}
