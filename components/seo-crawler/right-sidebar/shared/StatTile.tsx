import React from 'react'
import { toneClass, type Tone } from './tones'
export function StatTile({ label, value, sub, tone, onClick }: {
	label: string
	value: React.ReactNode
	sub?: string
	tone?: Tone
	onClick?: () => void
}) {
	const valTone = tone ? toneClass(tone).split(' ')[0] : 'text-white'
	return (
		<div
			onClick={onClick}
			className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded p-2 transition-colors ${
				onClick ? 'cursor-pointer hover:border-[#2a2a2a] hover:bg-[#111]' : ''
			}`}
		>
			<div className="text-[9px] text-[#666] uppercase tracking-widest">{label}</div>
			<div className={`text-[16px] font-black mt-0.5 ${valTone} font-mono`}>{value}</div>
			{sub && <div className="text-[9px] text-[#777] mt-0.5">{sub}</div>}
		</div>
	)
}
