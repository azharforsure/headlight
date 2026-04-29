import React from 'react'
import { Card, SectionTitle, Row, StackedBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { TechnicalStats } from '../../../../../services/right-sidebar/technical'

export function TechCrawlTab({ stats }: RsTabProps<TechnicalStats>) {
	const c = stats.crawl
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>Status mix</SectionTitle>
				<StackedBar parts={[
					{ value: c.ok, color: '#34d399', label: '2xx' },
					{ value: c.redirect, color: '#60a5fa', label: '3xx' },
					{ value: c.client, color: '#fbbf24', label: '4xx' },
					{ value: c.server, color: '#fb7185', label: '5xx' },
				]} />
			</Card>
			<Card>
				<SectionTitle>Depth</SectionTitle>
				<Row label="Avg depth" value={c.depthAvg == null ? '—' : c.depthAvg} />
				<Row label="Max depth" value={c.depthMax == null ? '—' : c.depthMax} />
			</Card>
		</div>
	)
}
