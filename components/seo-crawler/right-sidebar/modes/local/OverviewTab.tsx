import React from 'react'
import { KpiHeader, Chip, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { LocalStats } from '../../../../../services/right-sidebar/local'

export function LocalOverviewTab({ stats }: RsTabProps<LocalStats>) {
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="Local SEO" chips={[
				<Chip key="lb" tone={stats.nap.withLocalBusiness ? 'good' : 'warn'}>LocalBusiness {stats.nap.withLocalBusiness}</Chip>,
				<Chip key="phone" tone={stats.nap.withPhone ? 'good' : 'warn'}>Phone {stats.nap.withPhone}</Chip>,
				<Chip key="nap" tone={stats.nap.mismatchSuspect ? 'warn' : 'good'}>NAP variants {stats.nap.mismatchSuspect}</Chip>,
			]} />
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="With address" value={stats.nap.withPostalAddress} />
				<StatTile label="With geo" value={stats.nap.withGeo} />
				<StatTile label="On-site reviews" value={stats.reviews.onSite} />
				<StatTile label="AggregateRating" value={stats.reviews.aggregateRatingPages} />
			</div>
		</div>
	)
}
