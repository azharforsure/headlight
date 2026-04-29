import React from 'react'
import { Card, SectionTitle, Row, StatTile, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { PaidStats } from '../../../../../services/right-sidebar/paid'

export function PaidQualityTab({ stats }: RsTabProps<PaidStats>) {
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>Landing-page score</SectionTitle>
				<ProgressBar value={stats.quality.landingScoreAvg} max={100} />
				<div className="text-[10px] text-[#888] mt-1">Avg LP score across {stats.quality.landingPagesScored} scored landing pages</div>
			</Card>
			<Card>
				<SectionTitle>Quality Score (Google Ads)</SectionTitle>
				<Row label="Avg QS" value={stats.quality.qsAvg == null ? '— (needs Google Ads)' : stats.quality.qsAvg} />
			</Card>
		</div>
	)
}
