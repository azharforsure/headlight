import React from 'react'
import { Card, SectionTitle, ActionListItem } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { ContentStats } from '../../../../../services/right-sidebar/content'

export function ContentActionsTab({ stats }: RsTabProps<ContentStats>) {
	return (
		<Card>
			<SectionTitle>Top fixes</SectionTitle>
			{stats.actions.length === 0
				? <div className="text-[11px] text-[#666]">Content looks clean. Re-check after the next crawl.</div>
				: stats.actions.map(a => <ActionListItem key={a.id} effort={a.effort} label={a.label} impact={a.impact} />)}
		</Card>
	)
}
