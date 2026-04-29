import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, StatTile, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CompetitorsStats } from '../../../../../services/right-sidebar/competitors'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function CompLossesTab({ stats }: RsTabProps<CompetitorsStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.connections.serp) return <RsEmpty
		title="Losses tracking needs SERP"
		hint="See which keywords competitors recently outranked you for."
		cta={ { label: 'Connect SERP', onClick: () => openIntegrationsModal?.('serp') } }
	/>
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Ranked down" value={stats.losses.rankDown ?? '—'} />
			</div>
			<Card>
				<SectionTitle>Top losers</SectionTitle>
				{(!stats.losses.topLosers || stats.losses.topLosers.length === 0)
					? <div className="text-[11px] text-[#666]">No losers detected.</div>
					: stats.losses.topLosers.map(l => <Row key={l.keyword} label={l.keyword} value={`-${l.delta}`} tone="bad" />)}
			</Card>
		</div>
	)
}
