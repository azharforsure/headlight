import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, StatTile, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CompetitorsStats } from '../../../../../services/right-sidebar/competitors'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function CompWinsTab({ stats }: RsTabProps<CompetitorsStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.connections.serp) return <RsEmpty
		title="Wins tracking needs SERP"
		hint="See which keywords you recently outranked competitors for."
		cta={ { label: 'Connect SERP', onClick: () => openIntegrationsModal?.('serp') } }
	/>
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Ranked up" value={stats.wins.rankUp ?? '—'} />
			</div>
			<Card>
				<SectionTitle>Top gainers</SectionTitle>
				{(!stats.wins.topGainers || stats.wins.topGainers.length === 0)
					? <div className="text-[11px] text-[#666]">No gainers detected.</div>
					: stats.wins.topGainers.map(g => <Row key={g.keyword} label={g.keyword} value={`+${g.delta}`} tone="good" />)}
			</Card>
		</div>
	)
}
