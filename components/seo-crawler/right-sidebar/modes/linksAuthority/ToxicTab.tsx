import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LinksStats } from '../../../../../services/right-sidebar/linksAuthority'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function LinksToxicTab({ stats }: RsTabProps<LinksStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (stats.toxic.total == null) {
		return <RsEmpty
			title="Toxic-link analysis needs a backlinks integration"
			hint="Connect Ahrefs or Majestic to surface referring domains and toxicity signals."
			cta={ { label: 'Connect backlinks source', onClick: () => openIntegrationsModal?.('backlinks') } }
		/>
	}
	return (
		<Card>
			<SectionTitle>Toxic referring domains</SectionTitle>
			{(stats.toxic.topDomains ?? []).map(d => <Row key={d.domain} label={d.domain} value={d.refs} tone="bad" />)}
		</Card>
	)
}
