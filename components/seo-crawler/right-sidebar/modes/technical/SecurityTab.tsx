import React from 'react'
import { Card, SectionTitle, Row, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { TechnicalStats } from '../../../../../services/right-sidebar/technical'

export function TechSecurityTab({ stats }: RsTabProps<TechnicalStats>) {
	const s = stats.security
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>HTTPS</SectionTitle>
				<ProgressBar value={s.https} max={stats.indexing.total || 1} />
				<div className="text-[10px] text-[#888] mt-1">{s.https} / {stats.indexing.total}</div>
			</Card>
			<Card>
				<SectionTitle>Risks</SectionTitle>
				<Row label="Mixed content" value={s.mixedContent} tone={s.mixedContent ? 'bad' : 'good'} />
				<Row label="Missing/weak HSTS" value={s.weakHsts} tone={s.weakHsts ? 'warn' : 'good'} />
				<Row label="HTTP redirects" value={s.httpRedirects} tone={s.httpRedirects ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
