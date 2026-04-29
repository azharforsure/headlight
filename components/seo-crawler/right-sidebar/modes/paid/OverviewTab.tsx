import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { KpiHeader, Chip, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { PaidStats } from '../../../../../services/right-sidebar/paid'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function PaidOverviewTab({ stats }: RsTabProps<PaidStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	const { connections } = stats
	if (!connections.googleAds && !connections.metaAds) {
		return <RsEmpty
			title="Connect a paid source to unlock this mode"
			hint="Google Ads and Meta Ads light up spend, CPC, conversions, and quality score."
			cta={ { label: 'Connect ads source', onClick: () => openIntegrationsModal?.('googleAds') } }
		/>
	}
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore ?? 0} label="Paid health" chips={[
				<Chip key="gads" tone={connections.googleAds ? 'good' : 'neutral'}>Google Ads {connections.googleAds ? 'on' : 'off'}</Chip>,
				<Chip key="meta" tone={connections.metaAds ? 'good' : 'neutral'}>Meta Ads {connections.metaAds ? 'on' : 'off'}</Chip>,
			]} />
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Landing pages" value={stats.landing.total} />
				<StatTile label="LP score" value={stats.quality.landingScoreAvg} />
				<StatTile label="Slow LPs" value={stats.landing.slow} tone={stats.landing.slow ? 'warn' : 'good'} />
				<StatTile label="Missing meta" value={stats.landing.missingTitle + stats.landing.missingDesc} tone={(stats.landing.missingTitle + stats.landing.missingDesc) ? 'warn' : 'good'} />
			</div>
		</div>
	)
}
