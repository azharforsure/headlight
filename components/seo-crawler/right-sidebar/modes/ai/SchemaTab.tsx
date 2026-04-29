import React from 'react'
import { Card, SectionTitle, Row, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { AiStats } from '../../../../../services/right-sidebar/ai'

export function AiSchemaTab({ stats }: RsTabProps<AiStats>) {
	const s = stats.schema
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>Schema coverage</SectionTitle>
				<ProgressBar value={s.covered} max={s.total || 1} />
				<div className="text-[10px] text-[#888] mt-1">{s.covered} / {s.total} pages have valid schema.org</div>
			</Card>
			<Card>
				<SectionTitle>Top types</SectionTitle>
				{s.topTypes.map(t => <Row key={t.type} label={t.type} value={t.count} />)}
			</Card>
		</div>
	)
}
