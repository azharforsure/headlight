import React from 'react'
import { ProgressBar } from './ProgressBar'
export function Bar({ label, value, max = 100, tone }: {
	label?: string
	value: number
	max?: number
	tone?: 'good' | 'warn' | 'bad' | 'info'
}) {
	return (
		<div>
			{label && (
				<div className="flex justify-between text-[10px] text-[#888] mb-1">
					<span>{label}</span>
					<span className="font-mono text-white">{Math.round((value / max) * 100)}%</span>
				</div>
			)}
			<ProgressBar value={value} max={max} tone={tone} />
		</div>
	)
}
