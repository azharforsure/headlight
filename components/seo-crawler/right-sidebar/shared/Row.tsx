import React from 'react'
import { toneClass, type Tone } from './tones'
export function Row({ label, value, tone, onClick }: {
	label: React.ReactNode
	value: React.ReactNode
	tone?: Tone
	onClick?: () => void
}) {
	const valTone = tone ? toneClass(tone).split(' ')[0] : 'text-white'
	return (
		<div
			onClick={onClick}
			className={`flex items-center justify-between text-[11px] py-1 border-b border-[#1a1a1a] last:border-b-0 ${
				onClick ? 'cursor-pointer hover:bg-[#111] -mx-3 px-3' : ''
			}`}
		>
			<span className="text-[#888]">{label}</span>
			<span className={`${valTone} font-mono`}>{value}</span>
		</div>
	)
}
