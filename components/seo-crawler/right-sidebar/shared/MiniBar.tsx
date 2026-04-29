import React from 'react'
export function MiniBar({ data, height = 56 }: {
	data: { label: string; value: number; color?: string }[]
	height?: number
}) {
	const max = Math.max(1, ...data.map(d => d.value))
	return (
		<div className="flex items-end gap-1" style={ { height } }>
			{data.map((d, i) => (
				<div key={i} className="flex-1 flex flex-col items-center gap-1">
					<div
						className="w-full rounded-t"
						style={{ height: `${(d.value / max) * 100}%`, background: d.color ?? '#60a5fa' }}
						title={`${d.label}: ${d.value}`}
					/>
					<div className="text-[8px] text-[#666] truncate w-full text-center">{d.label}</div>
				</div>
			))}
		</div>
	)
}
