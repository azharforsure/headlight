import React from 'react'
import { Card, SectionTitle, KpiHeader, StatTile, Chip, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { ContentStats } from '../../../../../services/right-sidebar/content'

export function ContentOverviewTab({ stats }: RsTabProps<ContentStats>) {
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="Content health" chips={[
				<Chip key="total" tone="info">{stats.coverage.total} pages</Chip>,
				<Chip key="words" tone={stats.quality.avgWords > 600 ? 'good' : 'warn'}>avg {stats.quality.avgWords}w</Chip>,
			]} />
			<Card>
				<SectionTitle>Coverage</SectionTitle>
				<div className="text-[10px] text-[#888] mb-1">Title</div>
				<ProgressBar value={stats.coverage.withTitle} max={stats.coverage.total || 1} />
				<div className="text-[10px] text-[#888] mt-2 mb-1">Description</div>
				<ProgressBar value={stats.coverage.withDesc} max={stats.coverage.total || 1} />
				<div className="text-[10px] text-[#888] mt-2 mb-1">H1</div>
				<ProgressBar value={stats.coverage.withH1} max={stats.coverage.total || 1} />
			</Card>
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Thin pages" value={stats.quality.thin} tone={stats.quality.thin ? 'warn' : 'good'} />
				<StatTile label="Long-form pages" value={stats.quality.long} />
				<StatTile label="Dup titles" value={stats.dup.titles} tone={stats.dup.titles ? 'warn' : 'good'} />
				<StatTile label="Images w/o alt" value={stats.images.withoutAlt} tone={stats.images.withoutAlt ? 'warn' : 'good'} />
			</div>
		</div>
	)
}
