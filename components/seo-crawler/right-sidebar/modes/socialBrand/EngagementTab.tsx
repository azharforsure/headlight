import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { SocialStats } from '../../../../../services/right-sidebar/socialBrand'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function SocialEngagementTab({ stats }: RsTabProps<SocialStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.engagement.connected) return <RsEmpty
		title="Connect a social account"
		hint="X / Twitter, Facebook, or LinkedIn unlock follower counts and engagement."
		cta={ { label: 'Connect social', onClick: () => openIntegrationsModal?.('twitter') } }
	/>
	return (
		<div className="grid grid-cols-2 gap-2">
			<StatTile label="Followers" value={stats.engagement.followers ?? '—'} />
			<StatTile label="Posts (30d)" value={stats.engagement.postsLast30 ?? '—'} />
			<StatTile label="Engagement rate" value={stats.engagement.engagementRate == null ? '—' : `${stats.engagement.engagementRate}%`} />
		</div>
	)
}
