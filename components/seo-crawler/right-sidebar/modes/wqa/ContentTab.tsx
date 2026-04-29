import React from 'react'
import { Card, SectionTitle, StatTile, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

export function WqaContentTab({ stats }: RsTabProps<WqaStats>) {
	const c = stats.content
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="With title" value={c.withTitle} />
				<StatTile label="With desc" value={c.withDesc} />
				<StatTile label="With H1" value={c.withH1} />
				<StatTile label="Avg words" value={c.avgWords} />
			</div>
			<Card>
				<SectionTitle>Duplicates & thin pages</SectionTitle>
				<Row label="Thin (<300w)" value={c.thin} tone={c.thin ? 'warn' : 'good'} />
				<Row label="Duplicate titles" value={c.dupTitles} tone={c.dupTitles ? 'warn' : 'good'} />
				<Row label="Duplicate descriptions" value={c.dupDescriptions} tone={c.dupDescriptions ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
