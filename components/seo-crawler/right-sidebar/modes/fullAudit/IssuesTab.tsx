import React from 'react'
import { Card, SectionTitle, Chip, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { FaSiteStats } from '../../../../../services/right-sidebar/fullAudit'

const toneFor = (sev: 'critical' | 'warning' | 'notice') => sev === 'critical' ? 'bad' : sev === 'warning' ? 'warn' : 'info'

export function FaIssuesTab({ stats }: RsTabProps<FaSiteStats>) {
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle action={<Chip tone="neutral">{stats.totals.withIssues}</Chip>}>All issues</SectionTitle>
				{stats.issuesByCategory.length === 0
					? <div className="text-[11px] text-[#666]">No issues detected.</div>
					: stats.issuesByCategory.map(i => (
						<Row key={i.category}
							label={<span className="flex items-center gap-2"><Chip tone={toneFor(i.severity)}>{i.severity}</Chip>{i.category}</span>}
							value={i.count}
						/>
					))}
			</Card>
		</div>
	)
}
