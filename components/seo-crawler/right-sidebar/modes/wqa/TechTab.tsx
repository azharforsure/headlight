import React from 'react'
import { Card, SectionTitle, Row, StatTile, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

export function WqaTechTab({ stats }: RsTabProps<WqaStats>) {
	const t = stats.tech
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>HTTPS coverage</SectionTitle>
				<ProgressBar value={t.https} max={t.httpsTotal || 1} />
				<div className="text-[10px] text-[#888] mt-1">{t.https} / {t.httpsTotal} pages on HTTPS</div>
			</Card>
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Avg response" value={t.avgResponseMs == null ? '—' : `${t.avgResponseMs}ms`} />
				<StatTile label="Heavy pages" value={t.heavyPages} tone={t.heavyPages ? 'warn' : 'good'} />
				<StatTile label="Slow pages" value={t.slowPages} tone={t.slowPages ? 'warn' : 'good'} />
			</div>
		</div>
	)
}
