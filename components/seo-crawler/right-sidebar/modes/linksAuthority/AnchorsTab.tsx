import React from 'react'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LinksStats } from '../../../../../services/right-sidebar/linksAuthority'

export function LinksAnchorsTab({ stats }: RsTabProps<LinksStats>) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Empty anchors" value={stats.anchors.emptyAnchors} tone={stats.anchors.emptyAnchors ? 'warn' : 'good'} />
				<StatTile label="Generic anchors" value={stats.anchors.genericAnchors} tone={stats.anchors.genericAnchors ? 'warn' : 'good'} />
			</div>
			<Card>
				<SectionTitle>Top anchors</SectionTitle>
				{stats.anchors.topAnchors.map(a => <Row key={a.text} label={`“${a.text}”`} value={a.count} />)}
			</Card>
		</div>
	)
}
