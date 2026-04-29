import React from 'react'
import { Card, SectionTitle, KpiHeader, StatTile, Chip } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { TechnicalStats } from '../../../../../services/right-sidebar/technical'

export function TechOverviewTab({ stats }: RsTabProps<TechnicalStats>) {
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="Technical health" chips={[
				<Chip key="indexable" tone="info">{stats.indexing.indexable} indexable</Chip>,
				<Chip key="errors" tone={stats.crawl.client + stats.crawl.server ? 'bad' : 'good'}>{stats.crawl.client + stats.crawl.server} HTTP errors</Chip>,
			]} />
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="HTTPS" value={`${stats.security.https}/${stats.indexing.total}`} />
				<StatTile label="Avg response" value={stats.speed.avgMs == null ? '—' : `${stats.speed.avgMs}ms`} />
				<StatTile label="Median response" value={stats.speed.medMs == null ? '—' : `${stats.speed.medMs}ms`} />
				<StatTile label="Heavy pages" value={stats.sizes.heavyPages} tone={stats.sizes.heavyPages ? 'warn' : 'good'} />
			</div>
		</div>
	)
}
