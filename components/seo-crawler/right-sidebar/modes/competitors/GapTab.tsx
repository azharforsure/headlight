import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CompetitorsStats } from '../../../../../services/right-sidebar/competitors'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function CompGapTab({ stats }: RsTabProps<CompetitorsStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.connections.serp) return <RsEmpty
		title="Gap analysis needs SERP"
		hint="See keywords competitors rank for that you don't."
		cta={ { label: 'Connect SERP', onClick: () => openIntegrationsModal?.('serp') } }
	/>
	return (
		<div className="grid grid-cols-2 gap-2">
			<StatTile label="Gap keywords" value={stats.gap.keywords ?? '—'} />
			<StatTile label="They rank" value={stats.gap.theirs ?? '—'} />
			<StatTile label="You rank" value={stats.gap.mine ?? '—'} />
		</div>
	)
}
