import React from 'react'
import { KpiHeader, Chip, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LinksStats } from '../../../../../services/right-sidebar/linksAuthority'

export function LinksOverviewTab({ stats }: RsTabProps<LinksStats>) {
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="Link health" chips={[
				<Chip key="internal" tone="info">{stats.internal.total} internal</Chip>,
				<Chip key="external" tone="info">{stats.external.total} external</Chip>,
				<Chip key="orphans" tone={stats.internal.orphans ? 'warn' : 'good'}>{stats.internal.orphans} orphans</Chip>,
			]} />
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Broken internal" value={stats.internal.brokenInternal} tone={stats.internal.brokenInternal ? 'bad' : 'good'} />
				<StatTile label="Deep pages (>4)" value={stats.internal.deepPages} />
				<StatTile label="Empty anchors" value={stats.anchors.emptyAnchors} tone={stats.anchors.emptyAnchors ? 'warn' : 'good'} />
				<StatTile label="Generic anchors" value={stats.anchors.genericAnchors} tone={stats.anchors.genericAnchors ? 'warn' : 'good'} />
			</div>
		</div>
	)
}
