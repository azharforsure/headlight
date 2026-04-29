import React from 'react'
import { KpiHeader, Chip, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { AiStats } from '../../../../../services/right-sidebar/ai'

export function AiOverviewTab({ stats }: RsTabProps<AiStats>) {
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="AI readiness" chips={[
				<Chip key="insights" tone="info">{stats.insights.count} AI insights</Chip>,
				<Chip key="entities" tone="info">{stats.entities.total} entities</Chip>,
			]} />
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Schema coverage" value={`${stats.schema.covered}/${stats.schema.total}`} />
				<StatTile label="Main language" value={stats.language || '—'} />
				<StatTile label="Readability" value={stats.readabilityScore == null ? '—' : stats.readabilityScore} />
				<StatTile label="Sentiment" value={stats.sentiment || '—'} />
			</div>
		</div>
	)
}
