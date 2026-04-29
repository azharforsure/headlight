import React from 'react'
import { toneClass, type Tone } from './tones'
export function Chip({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
	return (
		<span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${toneClass(tone)}`}>
			{children}
		</span>
	)
}
