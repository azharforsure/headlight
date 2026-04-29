import React from 'react'
import { Card, SectionTitle, MiniBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { ContentStats } from '../../../../../services/right-sidebar/content'

export function ContentTopicsTab({ stats }: RsTabProps<ContentStats>) {
	const data = stats.topics.map(t => ({ label: t.name, value: t.pages, color: '#fbbf24' }))
	return (
		<Card>
			<SectionTitle>Top topics</SectionTitle>
			{data.length === 0
				? <div className="text-[11px] text-[#666]">No topic signals detected. Topic extraction runs after the next crawl.</div>
				: <MiniBar data={data} height={120} />}
		</Card>
	)
}
