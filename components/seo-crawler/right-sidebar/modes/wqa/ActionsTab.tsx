import React from 'react'
import { Card, SectionTitle, ActionListItem } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function WqaActionsTab({ stats }: RsTabProps<WqaStats>) {
	const { setWqaFilter } = useSeoCrawler()
	return (
		<Card>
			<SectionTitle>Top quick fixes</SectionTitle>
			{stats.actions.length === 0
				? <div className="text-[11px] text-[#666]">Nothing urgent. Re-check after the next crawl.</div>
				: stats.actions.map(a =>
					<ActionListItem key={a.id} effort={a.effort} label={a.label} impact={a.impact}
						onClick={() => setWqaFilter?.({ source: 'rs-actions', id: a.id } as any)} />
				)}
		</Card>
	)
}
