import React from 'react'
import { Card, SectionTitle, ActionListItem } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { AiStats } from '../../../../../services/right-sidebar/ai'

export function AiInsightsTab({ stats }: RsTabProps<AiStats>) {
	return (
		<Card>
			<SectionTitle>AI insights</SectionTitle>
			{stats.insights.items.length === 0
				? <div className="text-[11px] text-[#666]">No insights yet. Run "AI Analysis" to generate them.</div>
				: stats.insights.items.map((it, idx) => <ActionListItem key={idx} effort="low" label={it} impact={80} />)}
		</Card>
	)
}
