import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { PaidStats } from '../../../../../services/right-sidebar/paid'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function PaidMatchTab({ stats }: RsTabProps<PaidStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (stats.match.kwToLandingMatch == null) return <RsEmpty
		title="Keyword ↔ landing match needs Google Ads"
		hint="Connect Google Ads to compare each ad keyword to the landing page topic."
		cta={ { label: 'Connect Google Ads', onClick: () => openIntegrationsModal?.('googleAds') } }
	/>
	return (
		<div className="grid grid-cols-2 gap-2">
			<StatTile label="KW ↔ LP match" value={`${stats.match.kwToLandingMatch}%`} />
			<StatTile label="LP ↔ product match" value={stats.match.lpToProductMatch == null ? '—' : `${stats.match.lpToProductMatch}%`} />
		</div>
	)
}
