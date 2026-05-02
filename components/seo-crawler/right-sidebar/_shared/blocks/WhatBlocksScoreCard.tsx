import React from 'react'
import { Card } from '../Card'
import { Section } from '../Section'

export type Deduction = { id: string; label: string; points: number; onClick?: () => void }

export function WhatBlocksScoreCard({
	title = 'What blocks your score',
	deductions = [],
	totalLost = 0,
}: {
	title?: string
	deductions?: ReadonlyArray<Deduction>
	totalLost?: number
}) {
	if (!deductions?.length) return null
	const max = Math.max(...deductions.map(d => d.points), 1)
	return (
		<Card>
			<Section title={title} dense action={<span className="text-[#ef4444]">−{Math.round(totalLost)} pts total</span>}>
				<div className="flex flex-col">
					{deductions.map(d => (
						<button
							key={d.id}
							onClick={d.onClick}
							className="grid grid-cols-[1fr_60px_36px] items-center gap-2 px-2 py-1.5 rounded hover:bg-[#0f0f0f] transition-colors"
						>
							<span className="text-[11px] text-[#ddd] truncate text-left">{d.label}</span>
							<div className="h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
								<div className="h-full rounded-full bg-[#ef4444]" style={{ width: `${(d.points / max) * 100}%` }} />
							</div>
							<span className="text-[11px] font-mono tabular-nums text-right text-[#ef4444]">−{Math.round(d.points)}</span>
						</button>
					))}
				</div>
			</Section>
		</Card>
	)
}
