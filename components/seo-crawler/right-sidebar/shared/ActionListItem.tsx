import React from 'react'
import { Chip } from './Chip'
import type { Tone } from './tones'
export function ActionListItem({ effort, label, impact, onClick }: {
	effort: 'low' | 'medium' | 'high'
	label: string
	impact: number
	onClick?: () => void
}) {
	const tone: Tone = effort === 'low' ? 'good' : effort === 'high' ? 'bad' : 'warn'
	return (
		<div onClick={onClick} className={`flex items-center justify-between text-[11px] py-1.5 border-b border-[#1a1a1a] last:border-b-0 ${onClick ? 'cursor-pointer hover:bg-[#111] -mx-3 px-3' : ''}`}>
			<div className="flex items-center gap-2 min-w-0">
				<Chip tone={tone}>{effort}</Chip>
				<span className="text-[#ddd] truncate">{label}</span>
			</div>
			<span className="text-white font-mono">{impact.toLocaleString()}</span>
		</div>
	)
}
