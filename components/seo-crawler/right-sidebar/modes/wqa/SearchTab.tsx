import React from 'react'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

export function WqaSearchTab({ stats }: RsTabProps<WqaStats>) {
	const s = stats.search
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Indexable" value={s.indexable} tone="good" />
				<StatTile label="Non-indexable" value={s.nonIndexable} tone={s.nonIndexable ? 'warn' : 'good'} />
			</div>
			<Card>
				<SectionTitle>Sitemap & canonicals</SectionTitle>
				<Row label="In sitemap" value={`${s.sitemapTotal - s.sitemapMissing} / ${s.sitemapTotal}`} />
				<Row label="Missing from sitemap" value={s.sitemapMissing} tone={s.sitemapMissing ? 'warn' : 'good'} />
				<Row label="Canonical conflicts" value={s.canonicalIssues} tone={s.canonicalIssues ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
