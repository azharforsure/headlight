import React from 'react'
export function MiniFunnel({ steps }: { steps: { label: string; value: number }[] }) {
	const max = Math.max(1, ...steps.map(s => s.value))
	return (
		<div className="space-y-1">
			{steps.map((s, i) => {
				const pct = (s.value / max) * 100
				return (
					<div key={i} className="flex items-center gap-2 text-[10px]">
						<span className="text-[#888] w-20 truncate">{s.label}</span>
						<div className="flex-1 bg-[#1a1a1a] rounded h-3 overflow-hidden">
							<div className="h-full bg-[#60a5fa]" style={{ width: `${pct}%` }} />
						</div>
						<span className="font-mono text-white w-10 text-right">{s.value.toLocaleString()}</span>
					</div>
				)
			})}
		</div>
	)
}
