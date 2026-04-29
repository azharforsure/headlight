import React from 'react'
import { Card, SectionTitle, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CommerceStats } from '../../../../../services/right-sidebar/commerce'

export function CommerceSchemaTab({ stats }: RsTabProps<CommerceStats>) {
	const s = stats.schema
	const rows: { label: string; value: number }[] = [
		{ label: 'Product', value: s.withProductSchema },
		{ label: 'Review/AggregateRating', value: s.withReviewSchema },
		{ label: 'FAQPage', value: s.withFaqSchema },
		{ label: 'BreadcrumbList', value: s.withBreadcrumbs },
	]
	return (
		<Card>
			<SectionTitle>Schema coverage</SectionTitle>
			{rows.map(r => (
				<div key={r.label} className="mb-2">
					<div className="text-[10px] text-[#888] mb-1">{r.label}</div>
					<ProgressBar value={r.value} max={s.total || 1} />
				</div>
			))}
		</Card>
	)
}
