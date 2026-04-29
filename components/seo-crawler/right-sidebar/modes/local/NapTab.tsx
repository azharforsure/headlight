import React from 'react'
import { Card, SectionTitle, Row, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LocalStats } from '../../../../../services/right-sidebar/local'

export function LocalNapTab({ stats }: RsTabProps<LocalStats>) {
	const n = stats.nap
	const rows = [
		{ label: 'LocalBusiness/Restaurant/Store', value: n.withLocalBusiness },
		{ label: 'Postal address',                 value: n.withPostalAddress },
		{ label: 'Phone',                          value: n.withPhone },
		{ label: 'Geo (lat/lng)',                  value: n.withGeo },
	]
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>NAP coverage</SectionTitle>
				{rows.map(r => (
					<div key={r.label} className="mb-2">
						<div className="text-[10px] text-[#888] mb-1">{r.label}</div>
						<ProgressBar value={r.value} max={n.total || 1} />
					</div>
				))}
			</Card>
			<Card>
				<SectionTitle>Consistency</SectionTitle>
				<Row label="Distinct phone variants on site" value={n.mismatchSuspect} tone={n.mismatchSuspect > 1 ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
