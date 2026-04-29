import React from 'react'
import { Card, SectionTitle, ActionListItem } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { SocialStats } from '../../../../../services/right-sidebar/socialBrand'

export function SocialActionsTab({ stats }: RsTabProps<SocialStats>) {
	return (
		<Card>
			<SectionTitle>Top fixes</SectionTitle>
			{stats.actions.length === 0
				? <div className="text-[11px] text-[#666]">All meta is in place.</div>
				: stats.actions.map(a => <ActionListItem key={a.id} effort={a.effort} label={a.label} impact={a.impact} />)}
		</Card>
	)
}
