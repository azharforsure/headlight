import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { KpiHeader, Chip, Row, Card, SectionTitle } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CompetitorsStats } from '../../../../../services/right-sidebar/competitors'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function CompOverviewTab({ stats }: RsTabProps<CompetitorsStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.connections.serp) return <RsEmpty
		title="Connect a SERP source"
		hint="DataForSEO / Serper / Custom SERP unlocks gap, wins, losses, and shared anchors."
		cta={ { label: 'Connect SERP', onClick: () => openIntegrationsModal?.('serp') } }
	/>
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore ?? 0} label="Competitor visibility" chips={[<Chip key="serp" tone="info">SERP connected</Chip>]} />
			<Card>
				<SectionTitle>Top competitors</SectionTitle>
				{(stats.competitors ?? []).length === 0 
					? <div className="text-[11px] text-[#666]">No competitor data found in recent SERPs.</div>
					: (stats.competitors ?? []).map(c => <Row key={c.domain} label={c.domain} value={c.overlapPct == null ? '—' : `${c.overlapPct}% overlap`} />)}
			</Card>
		</div>
	)
}
