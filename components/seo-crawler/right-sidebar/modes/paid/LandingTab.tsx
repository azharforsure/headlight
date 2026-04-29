import React from 'react'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { PaidStats } from '../../../../../services/right-sidebar/paid'

export function PaidLandingTab({ stats }: RsTabProps<PaidStats>) {
	const l = stats.landing
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Total LPs" value={l.total} />
				<StatTile label="Fast (<1.5s)" value={l.fast} tone="good" />
				<StatTile label="Slow (>3.5s)" value={l.slow} tone={l.slow ? 'warn' : 'good'} />
				<StatTile label="Avg TTFB" value={l.ttfbAvg == null ? '—' : `${l.ttfbAvg}ms`} />
			</div>
			<Card>
				<SectionTitle>Hygiene</SectionTitle>
				<Row label="HTTPS" value={`${l.httpsTotal}/${l.total}`} />
				<Row label="Missing title" value={l.missingTitle} tone={l.missingTitle ? 'warn' : 'good'} />
				<Row label="Missing description" value={l.missingDesc} tone={l.missingDesc ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
