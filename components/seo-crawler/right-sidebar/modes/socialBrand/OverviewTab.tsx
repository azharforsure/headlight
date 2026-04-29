import React from 'react'
import { KpiHeader, Chip, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { SocialStats } from '../../../../../services/right-sidebar/socialBrand'

export function SocialOverviewTab({ stats }: RsTabProps<SocialStats>) {
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="Social & brand" chips={[
				<Chip key="title" tone={stats.og.withOgTitle === stats.og.total ? 'good' : 'warn'}>OG title {stats.og.withOgTitle}/{stats.og.total}</Chip>,
				<Chip key="image" tone={stats.og.withOgImage === stats.og.total ? 'good' : 'warn'}>OG image {stats.og.withOgImage}/{stats.og.total}</Chip>,
				<Chip key="twitter" tone={stats.og.withTwitterCard === stats.og.total ? 'good' : 'warn'}>Tw card {stats.og.withTwitterCard}/{stats.og.total}</Chip>,
			]} />
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Social connected" value={stats.engagement.connected ? 'yes' : 'no'} />
				<StatTile label="Mentions tracking" value={stats.mentions.connected ? 'yes' : 'no'} />
			</div>
		</div>
	)
}
