import React from 'react'
import { Card, SectionTitle, StatTile, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { TechnicalStats } from '../../../../../services/right-sidebar/technical'

export function TechSpeedTab({ stats }: RsTabProps<TechnicalStats>) {
	const s = stats.speed
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Avg ms" value={s.avgMs == null ? '—' : s.avgMs} />
				<StatTile label="Median ms" value={s.medMs == null ? '—' : s.medMs} />
				<StatTile label="Slow (>2.5s)" value={s.slow} tone={s.slow ? 'warn' : 'good'} />
				<StatTile label="Very slow (>5s)" value={s.very} tone={s.very ? 'bad' : 'good'} />
			</div>
			<Card>
				<SectionTitle>Page sizes</SectionTitle>
				<Row label="Avg bytes" value={stats.sizes.avgBytes == null ? '—' : `${(stats.sizes.avgBytes / 1024).toFixed(1)} KB`} />
				<Row label="Heavy (>2MB)" value={stats.sizes.heavyPages} tone={stats.sizes.heavyPages ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
