import React from 'react'
import { Card, SectionTitle, Bar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { FaSiteStats } from '../../../../../services/right-sidebar/fullAudit'

export function FaScoresTab({ stats }: RsTabProps<FaSiteStats>) {
	const rows = [
		{ label: 'Indexability', value: stats.indexabilityScore },
		{ label: 'Content',      value: stats.contentScore },
		{ label: 'Technical',    value: stats.technicalScore },
		{ label: 'Performance',  value: stats.performanceScore },
	]
	return (
		<Card>
			<SectionTitle>Pillar scores</SectionTitle>
			<div className="space-y-2">
				{rows.map(r => <Bar key={r.label} label={r.label} value={r.value} />)}
			</div>
		</Card>
	)
}
