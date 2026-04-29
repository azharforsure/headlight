import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LocalStats } from '../../../../../services/right-sidebar/local'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function LocalPackTab({ stats }: RsTabProps<LocalStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.pack.topQueries) return <RsEmpty
		title="Local pack tracking needs SERP"
		hint="Connect SERP / GBP rank tracker to see which local queries return your business in the 3-pack."
		cta={ { label: 'Connect SERP', onClick: () => openIntegrationsModal?.('serp') } }
	/>
	return (
		<Card>
			<SectionTitle>Top local queries</SectionTitle>
			{stats.pack.topQueries.map(q => <Row key={q.keyword} label={q.keyword} value={q.rank == null ? 'not in pack' : `#${q.rank}`} />)}
		</Card>
	)
}
