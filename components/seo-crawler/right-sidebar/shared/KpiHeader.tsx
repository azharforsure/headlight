import React from 'react'
import { Chip } from './Chip'
import { scoreGrade, scoreTone } from './tones'
export function KpiHeader({ score, label, chips = [] }: {
	score: number
	label: string
	chips?: React.ReactNode[]
}) {
	const tone = scoreTone(score)
	const color = tone === 'good' ? '#34d399' : tone === 'warn' ? '#fbbf24' : '#fb7185'
	return (
		<div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
			<div className="flex items-end justify-between">
				<div>
					<div className="text-[10px] text-[#666] uppercase tracking-widest">{label}</div>
					<div className="flex items-baseline gap-2 mt-1">
						<div className="text-[32px] leading-none font-black font-mono" style={ { color } }>{Math.round(score)}</div>
						<div className="text-[14px] text-[#bbb] font-black">{scoreGrade(score)}</div>
					</div>
				</div>
			</div>
			{chips.length > 0 && (
				<div className="flex flex-wrap gap-1 mt-3">{chips.map((c, i) => <span key={i}>{c}</span>)}</div>
			)}
		</div>
	)
}
