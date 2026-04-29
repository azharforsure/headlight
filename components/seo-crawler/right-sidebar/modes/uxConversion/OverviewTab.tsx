import React from 'react'
import { KpiHeader, Chip, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { UxStats } from '../../../../../services/right-sidebar/uxConversion'

export function UxOverviewTab({ stats }: RsTabProps<UxStats>) {
	const v = stats.vitals
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="UX & conversion" chips={[
				<Chip key="lcp" tone={v.lcpGood >= v.lcpPoor ? 'good' : 'warn'}>LCP {v.lcpGood}/{v.lcpGood + v.lcpPoor}</Chip>,
				<Chip key="cls" tone={v.clsGood >= v.clsPoor ? 'good' : 'warn'}>CLS {v.clsGood}/{v.clsGood + v.clsPoor}</Chip>,
				<Chip key="inp" tone={v.inpGood >= v.inpPoor ? 'good' : 'warn'}>INP {v.inpGood}/{v.inpGood + v.inpPoor}</Chip>,
			]} />
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Pages with CTA" value={stats.conversion.ctaPresent} />
				<StatTile label="Pages with form" value={stats.conversion.formPresent} />
				<StatTile label="Alt missing" value={stats.a11y.altMissing} tone={stats.a11y.altMissing ? 'warn' : 'good'} />
				<StatTile label="Popup-heavy" value={stats.friction.popupHeavy} tone={stats.friction.popupHeavy ? 'warn' : 'good'} />
			</div>
		</div>
	)
}
