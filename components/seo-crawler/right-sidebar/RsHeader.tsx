import React from 'react'
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext'
import { getBundle } from '../../../services/right-sidebar/registry'
import { Chip } from './shared/Chip'
import { ago } from './shared/formatters'

const MODE_LABEL: Record<string, string> = {
	fullAudit: 'Full Audit',
	wqa: 'Website Quality',
	technical: 'Technical',
	content: 'Content',
	linksAuthority: 'Links & Authority',
	uxConversion: 'UX & Conversion',
	paid: 'Paid',
	commerce: 'Commerce',
	socialBrand: 'Social & Brand',
	ai: 'AI',
	competitors: 'Competitors',
	local: 'Local',
}

export function RsHeader() {
	const { mode, pages, lastCrawlAt } = useSeoCrawler()
	const bundle = getBundle(mode)
	const label = MODE_LABEL[mode] ?? mode

	return (
		<div className="h-[34px] border-b border-[#1a1a1a] flex items-center px-3 justify-between bg-[#0a0a0a] shrink-0">
			<div className="flex items-center gap-2">
				<Chip tone={bundle?.accent ?? 'slate'}>{label}</Chip>
				<span className="text-[10px] text-[#666] font-mono">{pages.length} pages</span>
			</div>
			{lastCrawlAt && (
				<span className="text-[10px] text-[#555] font-mono">updated {ago(lastCrawlAt)}</span>
			)}
		</div>
	)
}
