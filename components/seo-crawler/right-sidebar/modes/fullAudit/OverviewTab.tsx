import React from 'react'
import { Card, SectionTitle, Chip, StatTile, KpiHeader, MiniDonut } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { FaSiteStats } from '../../../../../services/right-sidebar/fullAudit'

export function FaOverviewTab({ stats }: RsTabProps<FaSiteStats>) {
	const donut = [
		{ name: 'OK', value: stats.crawlSummary.httpOk, color: '#34d399' },
		{ name: '3xx', value: stats.crawlSummary.http3xx, color: '#60a5fa' },
		{ name: '4xx', value: stats.crawlSummary.http4xx, color: '#fbbf24' },
		{ name: '5xx', value: stats.crawlSummary.http5xx, color: '#fb7185' },
	]
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="Site health" chips={[
				<Chip key="pages" tone="info">{stats.totals.pages} pages</Chip>,
				<Chip key="errors" tone={stats.totals.withErrors === 0 ? 'good' : 'bad'}>{stats.totals.withErrors} errors</Chip>,
				<Chip key="issues" tone={stats.totals.withIssues > 100 ? 'warn' : 'good'}>{stats.totals.withIssues} issues</Chip>,
			]} />
			<Card>
				<SectionTitle>HTTP mix</SectionTitle>
				<div className="flex items-center gap-3"><MiniDonut data={donut} size={72} />
					<div className="text-[10px] space-y-0.5 flex-1">
						{donut.map(d => (
							<div key={d.name} className="flex justify-between"><span style={ { color: d.color } }>{d.name}</span><span className="font-mono text-white">{d.value}</span></div>
						))}
					</div>
				</div>
			</Card>
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Indexable" value={stats.totals.indexable} />
				<StatTile label="Avg response" value={stats.crawlSummary.avgResponseMs == null ? '—' : `${stats.crawlSummary.avgResponseMs}ms`} />
				<StatTile label="Indexability" value={`${stats.indexabilityScore}`} />
				<StatTile label="Performance" value={`${stats.performanceScore}`} />
			</div>
		</div>
	)
}
