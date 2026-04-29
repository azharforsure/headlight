import React from 'react'
import { Card, SectionTitle, Row, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { TechnicalStats } from '../../../../../services/right-sidebar/technical'

export function TechIndexingTab({ stats }: RsTabProps<TechnicalStats>) {
	const i = stats.indexing
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>Indexable coverage</SectionTitle>
				<ProgressBar value={i.indexable} max={i.total || 1} />
				<div className="text-[10px] text-[#888] mt-1">{i.indexable} / {i.total} pages indexable</div>
			</Card>
			<Card>
				<SectionTitle>Issues</SectionTitle>
				<Row label="Noindex" value={i.noindex} tone={i.noindex ? 'warn' : 'good'} />
				<Row label="Canonical conflicts" value={i.canonicalConflict} tone={i.canonicalConflict ? 'warn' : 'good'} />
				<Row label="In sitemap" value={i.inSitemap} />
				<Row label="Sitemap-only (uncrawled)" value={i.sitemapOnly} tone={i.sitemapOnly ? 'warn' : 'good'} />
				<Row label="Orphan pages" value={i.orphans} tone={i.orphans ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
