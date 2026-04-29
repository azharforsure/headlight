import React from 'react'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LinksStats } from '../../../../../services/right-sidebar/linksAuthority'

export function LinksExternalTab({ stats }: RsTabProps<LinksStats>) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Total external" value={stats.external.total} />
				<StatTile label="Nofollow" value={stats.external.nofollow} />
				<StatTile label="Broken external" value={stats.external.brokenExternal} tone={stats.external.brokenExternal ? 'bad' : 'good'} />
			</div>
			<Card>
				<SectionTitle>Top external domains</SectionTitle>
				{stats.external.topDomains.map(d => <Row key={d.domain} label={d.domain} value={d.links} />)}
			</Card>
		</div>
	)
}
