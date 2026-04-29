import React from 'react'
import { Card, SectionTitle, Row, StackedBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { UxStats } from '../../../../../services/right-sidebar/uxConversion'

export function UxVitalsTab({ stats }: RsTabProps<UxStats>) {
	const v = stats.vitals
	const row = (good: number, poor: number) => [
		{ value: good, color: '#34d399', label: 'good' },
		{ value: Math.max(0, v.total - good - poor), color: '#fbbf24', label: 'needs improvement' },
		{ value: poor, color: '#fb7185', label: 'poor' },
	]
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>LCP</SectionTitle><StackedBar parts={row(v.lcpGood, v.lcpPoor)} />
				<Row label="Good (<2.5s)" value={v.lcpGood} tone="good" />
				<Row label="Poor (>4s)" value={v.lcpPoor} tone={v.lcpPoor ? 'bad' : 'good'} />
			</Card>
			<Card>
				<SectionTitle>CLS</SectionTitle><StackedBar parts={row(v.clsGood, v.clsPoor)} />
				<Row label="Good (<0.1)" value={v.clsGood} tone="good" />
				<Row label="Poor (>0.25)" value={v.clsPoor} tone={v.clsPoor ? 'bad' : 'good'} />
			</Card>
			<Card>
				<SectionTitle>INP</SectionTitle><StackedBar parts={row(v.inpGood, v.inpPoor)} />
				<Row label="Good (<200ms)" value={v.inpGood} tone="good" />
				<Row label="Poor (>500ms)" value={v.inpPoor} tone={v.inpPoor ? 'bad' : 'good'} />
			</Card>
		</div>
	)
}
