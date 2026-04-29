import React from 'react'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { ContentStats } from '../../../../../services/right-sidebar/content'

export function ContentQualityTab({ stats }: RsTabProps<ContentStats>) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Avg words" value={stats.quality.avgWords} />
				<StatTile label="Readability" value={stats.quality.avgReadability == null ? '—' : stats.quality.avgReadability} />
				<StatTile label="Thin (<300w)" value={stats.quality.thin} tone={stats.quality.thin ? 'warn' : 'good'} />
				<StatTile label="Long (>1500w)" value={stats.quality.long} />
			</div>
			<Card>
				<SectionTitle>Duplicates</SectionTitle>
				<Row label="Duplicate titles" value={stats.dup.titles} tone={stats.dup.titles ? 'warn' : 'good'} />
				<Row label="Duplicate descriptions" value={stats.dup.descriptions} tone={stats.dup.descriptions ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
