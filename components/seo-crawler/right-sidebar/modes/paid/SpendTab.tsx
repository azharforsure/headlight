import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, StatTile, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { PaidStats } from '../../../../../services/right-sidebar/paid'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function PaidSpendTab({ stats }: RsTabProps<PaidStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (stats.spend.last30 == null) return <RsEmpty
		title="Spend metrics need a paid source"
		hint="Connect Google Ads or Meta Ads to see spend, CPC, and conversions."
		cta={ { label: 'Connect ads source', onClick: () => openIntegrationsModal?.('googleAds') } }
	/>
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Spend (30d)" value={`$${stats.spend.last30}`} />
				<StatTile label="Spend (7d)" value={`$${stats.spend.last7 ?? 0}`} />
				<StatTile label="Avg CPC" value={stats.spend.cpcAvg == null ? '—' : `$${stats.spend.cpcAvg}`} />
				<StatTile label="Conversions" value={stats.spend.convCount ?? 0} />
			</div>
		</div>
	)
}
