import React from 'react'
import { Card, SectionTitle, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LinksStats } from '../../../../../services/right-sidebar/linksAuthority'

const short = (u: string) => u.replace(/^https?:\/\/[^/]+/, '').slice(0, 32) || '/'

export function LinksInternalTab({ stats }: RsTabProps<LinksStats>) {
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>Top hubs (most outgoing internal)</SectionTitle>
				{stats.internal.topHubs.map(h => <Row key={h.url} label={short(h.url)} value={h.outgoing} />)}
			</Card>
			<Card>
				<SectionTitle>Top authorities (most incoming internal)</SectionTitle>
				{stats.internal.topAuthorities.map(a => <Row key={a.url} label={short(a.url)} value={a.incoming} />)}
			</Card>
		</div>
	)
}
