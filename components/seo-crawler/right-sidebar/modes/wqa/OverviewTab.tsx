import React from 'react'
import { Card, SectionTitle, Chip, KpiHeader, MiniRadar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

export function WqaOverviewTab({ stats }: RsTabProps<WqaStats>) {
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="Website quality" chips={stats.heroChips.map((c, i) => <Chip key={i} tone={c.tone}>{c.label}: {c.value}</Chip>)} />
			<Card><SectionTitle>Score breakdown</SectionTitle><div className="flex justify-center"><MiniRadar data={stats.radar} size={150} /></div></Card>
		</div>
	)
}
