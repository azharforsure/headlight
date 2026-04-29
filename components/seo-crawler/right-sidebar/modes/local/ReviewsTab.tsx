import React from 'react'
import { Card, SectionTitle, StatTile, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LocalStats } from '../../../../../services/right-sidebar/local'

export function LocalReviewsTab({ stats }: RsTabProps<LocalStats>) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="On-site reviews" value={stats.reviews.onSite} />
				<StatTile label="Pages w/ AggregateRating" value={stats.reviews.aggregateRatingPages} />
			</div>
			<Card>
				<SectionTitle>Notes</SectionTitle>
				<Row label="Aggregate rating exposure" value={`${stats.reviews.aggregateRatingPages} pages—improves SERP rich results`} />
			</Card>
		</div>
	)
}
