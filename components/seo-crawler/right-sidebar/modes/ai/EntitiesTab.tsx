import React from 'react'
import { Card, SectionTitle, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { AiStats } from '../../../../../services/right-sidebar/ai'

export function AiEntitiesTab({ stats }: RsTabProps<AiStats>) {
	return (
		<Card>
			<SectionTitle>Top entities</SectionTitle>
			{stats.entities.top.length === 0
				? <div className="text-[11px] text-[#666]">No entities detected. Entity extraction runs after the next crawl.</div>
				: stats.entities.top.map(e => <Row key={e.name} label={e.name} value={e.count} />)}
		</Card>
	)
}
