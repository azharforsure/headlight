import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LocalStats } from '../../../../../services/right-sidebar/local'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function LocalGbpTab({ stats }: RsTabProps<LocalStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.gbp.connected) return <RsEmpty
		title="Connect Google Business Profile"
		hint="GBP unlocks reviews, posts, and rating averages."
		cta={ { label: 'Connect GBP', onClick: () => openIntegrationsModal?.('gbp') } }
	/>
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Reviews" value={stats.gbp.reviewCount ?? '—'} />
				<StatTile label="Avg rating" value={stats.gbp.ratingAvg == null ? '—' : stats.gbp.ratingAvg} />
				<StatTile label="Posts (30d)" value={stats.gbp.postsLast30 ?? '—'} />
			</div>
			<Card>
				<SectionTitle>Profile</SectionTitle>
				<Row label="Profile found" value={stats.gbp.profileFound == null ? '—' : stats.gbp.profileFound ? 'yes' : 'no'} />
			</Card>
		</div>
	)
}
