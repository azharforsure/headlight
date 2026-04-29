import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { SocialStats } from '../../../../../services/right-sidebar/socialBrand'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function SocialMentionsTab({ stats }: RsTabProps<SocialStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.mentions.connected) return <RsEmpty
		title="Brand mentions need a listening source"
		hint="Connect a social listening / mentions feed to track brand sentiment."
		cta={ { label: 'Connect mentions', onClick: () => openIntegrationsModal?.('mentions') } }
	/>
	return (
		<div className="grid grid-cols-2 gap-2">
			<StatTile label="Total" value={stats.mentions.total ?? '—'} />
			<StatTile label="Positive" value={stats.mentions.positive ?? '—'} tone="good" />
			<StatTile label="Negative" value={stats.mentions.negative ?? '—'} tone={(stats.mentions.negative ?? 0) ? 'warn' : 'good'} />
		</div>
	)
}
