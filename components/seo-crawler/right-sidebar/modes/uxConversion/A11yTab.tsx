import React from 'react'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { UxStats } from '../../../../../services/right-sidebar/uxConversion'

export function UxA11yTab({ stats }: RsTabProps<UxStats>) {
	const a = stats.a11y
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Alt missing" value={a.altMissing} tone={a.altMissing ? 'warn' : 'good'} />
				<StatTile label="Empty buttons" value={a.emptyButtons} tone={a.emptyButtons ? 'warn' : 'good'} />
			</div>
			<Card>
				<SectionTitle>Notes</SectionTitle>
				<Row label="Low-contrast text" value={a.lowContrast == null ? '— (needs render-pass)' : a.lowContrast} />
			</Card>
		</div>
	)
}
