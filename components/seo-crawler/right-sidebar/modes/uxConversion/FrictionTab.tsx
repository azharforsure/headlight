import React from 'react'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { UxStats } from '../../../../../services/right-sidebar/uxConversion'

export function UxFrictionTab({ stats }: RsTabProps<UxStats>) {
	const f = stats.friction
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Popup-heavy pages" value={f.popupHeavy} tone={f.popupHeavy ? 'warn' : 'good'} />
				<StatTile label="Intrusive ads" value={f.intrusiveAds == null ? '—' : f.intrusiveAds} />
				<StatTile label="Long forms" value={f.longForms == null ? '—' : f.longForms} />
			</div>
			<Card>
				<SectionTitle>Notes</SectionTitle>
				<Row label="Definition" value="Popup-heavy = 2+ popups detected on the same page." />
			</Card>
		</div>
	)
}
