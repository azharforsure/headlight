import React from 'react'
export function StackedBar({ parts, height = 8 }: {
	parts: { value: number; color: string; label?: string }[]
	height?: number
}) {
	const total = parts.reduce((s, p) => s + p.value, 0) || 1
	return (
		<div>
			<div className="flex w-full rounded overflow-hidden" style={ { height } }>
				{parts.map((p, i) => (
					<div key={i} title={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
				))}
			</div>
			<div className="flex flex-wrap gap-2 mt-1">
				{parts.map((p, i) => (
					<span key={i} className="text-[10px] text-[#888] flex items-center gap-1">
						<span className="w-2 h-2 rounded-sm" style={ { background: p.color } } />
						{p.label} <span className="font-mono text-white">{p.value}</span>
					</span>
				))}
			</div>
		</div>
	)
}
