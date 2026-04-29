import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CompetitorsStats } from '../../../../../services/right-sidebar/competitors'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function CompAnchorsTab({ stats }: RsTabProps<CompetitorsStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.connections.serp) return <RsEmpty
		title="Shared anchors need SERP"
		hint="See which backlink anchor text you share with competitors."
		cta={ { label: 'Connect SERP', onClick: () => openIntegrationsModal?.('serp') } }
	/>
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Shared anchors" value={stats.anchors.shared ?? '—'} />
			</div>
			<Card>
				<SectionTitle>Common anchor text</SectionTitle>
				{(!stats.anchors.topAnchors || stats.anchors.topAnchors.length === 0)
					? <div className="text-[11px] text-[#666]">No shared anchors detected.</div>
					: stats.anchors.topAnchors.map(a => <Row key={a.text} label={a.text} value={a.count} />)}
			</Card>
		</div>
	)
}
