import React from 'react'
import { Card, SectionTitle, Row } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { ContentStats } from '../../../../../services/right-sidebar/content'

export function ContentAuthorsTab({ stats }: RsTabProps<ContentStats>) {
	return (
		<Card>
			<SectionTitle>Top authors</SectionTitle>
			{!stats.authors
				? <div className="text-[11px] text-[#666]">No author metadata found on the crawled pages. Add `author` schema or meta tags to enable this view.</div>
				: stats.authors.map(a => <Row key={a.name} label={a.name} value={`${a.pages} pages · ${a.avgWords}w`} />)}
		</Card>
	)
}
