import React from 'react'
import { Card, SectionTitle, Row, StackedBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { FaSiteStats } from '../../../../../services/right-sidebar/fullAudit'

export function FaCrawlTab({ stats }: RsTabProps<FaSiteStats>) {
	const c = stats.crawlSummary
	const parts = [
		{ value: c.httpOk,  color: '#34d399', label: '2xx' },
		{ value: c.http3xx, color: '#60a5fa', label: '3xx' },
		{ value: c.http4xx, color: '#fbbf24', label: '4xx' },
		{ value: c.http5xx, color: '#fb7185', label: '5xx' },
	]
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>Status mix</SectionTitle>
				<StackedBar parts={parts} height={10} />
			</Card>
			<Card>
				<SectionTitle>Numbers</SectionTitle>
				<Row label="Total crawled" value={c.totalCrawled} />
				<Row label="2xx OK"        value={c.httpOk} tone="good" />
				<Row label="3xx redirect"  value={c.http3xx} tone="info" />
				<Row label="4xx errors"    value={c.http4xx} tone={c.http4xx ? 'warn' : 'good'} />
				<Row label="5xx errors"    value={c.http5xx} tone={c.http5xx ? 'bad' : 'good'} />
				<Row label="Avg response"  value={c.avgResponseMs == null ? '—' : `${c.avgResponseMs}ms`} />
			</Card>
		</div>
	)
}
