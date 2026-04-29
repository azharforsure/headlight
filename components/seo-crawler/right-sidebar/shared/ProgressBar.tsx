import React from 'react'
import { scoreTone } from './tones'
export function ProgressBar({ value, max = 100, tone, height = 6 }: {
	value: number
	max?: number
	tone?: 'good' | 'warn' | 'bad' | 'info'
	height?: number
}) {
	const pct = Math.max(0, Math.min(100, (value / max) * 100))
	const t = tone ?? scoreTone(pct)
	const bg = t === 'good' ? 'bg-green-500' : t === 'warn' ? 'bg-orange-500' : t === 'bad' ? 'bg-red-500' : 'bg-blue-500'
	return (
		<div className="w-full bg-[#1a1a1a] rounded-full overflow-hidden" style={ { height } }>
			<div className={`h-full ${bg} transition-all`} style={{ width: `${pct}%` }} />
		</div>
	)
}
