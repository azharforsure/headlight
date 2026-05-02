import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/EmptyState'
import {
	selectActionsByPriority, selectActionsByType, selectActionTemplates,
	selectImpactForecast, selectOwnerLoad,
} from './_selectors'

export function WqaActions() {
	const { pages, openIssueDrawer } = useSeoCrawler() as any
	const hasTrend = useHasTrend()

	const byPriority = useMemo(() => selectActionsByPriority(pages), [pages])
	const byType = useMemo(() => selectActionsByType(pages), [pages])
	const templates = useMemo(() => selectActionTemplates(pages), [pages])
	const forecast = useMemo(() => selectImpactForecast(pages), [pages])
	const owners = useMemo(() => selectOwnerLoad(pages), [pages])

	if (!pages?.length) return <EmptyState label="No pages crawled yet" />

	const priorityTotal = byPriority.high + byPriority.medium + byPriority.low
	const typeTotal = byType.content + byType.tech + byType.links + byType.merge + byType.deprecate

	return (
		<div className="flex flex-col gap-3 p-3">
			<Card title="By priority">
				<Distribution 
					total={priorityTotal}
					rows={[
						{ label: 'High', value: byPriority.high, tone: 'bad' },
						{ label: 'Medium', value: byPriority.medium, tone: 'warn' },
						{ label: 'Low', value: byPriority.low, tone: undefined },
					]} 
				/>
			</Card>

			<Card title="By type">
				<Distribution 
					total={typeTotal}
					rows={[
						{ label: 'Content', value: byType.content, color: '#f59e0b' },
						{ label: 'Technical', value: byType.tech, color: '#3b82f6' },
						{ label: 'Link equity', value: byType.links, color: '#14b8a6' },
						{ label: 'Merge/Redirect', value: byType.merge, color: '#a78bfa' },
						{ label: 'Deprecate', value: byType.deprecate, color: '#94a3b8' },
					]} 
				/>
			</Card>

			<Card padded={false} title="Top action templates">
				<div className="flex flex-col border-t border-[#1f1f1f]">
					{templates.length === 0
						? <div className="p-3 text-[11px] text-[#666]">No actions queued.</div>
						: templates.map(t => (
							<RowItem
								key={t.id}
								label={t.label}
								value={`${t.affected}`}
								onClick={() => openIssueDrawer?.(`action:${t.id}`)}
							/>
						))
					}
				</div>
			</Card>

			{forecast && (
				<Card title="Impact forecast">
					<div className="flex flex-col gap-2">
						<div className="text-[10px] text-[#666] uppercase tracking-wider">Estimated if all High priority resolved</div>
						<div className="flex gap-4">
							<KpiTile label="Q-avg gain" value={`▲${forecast.deltaScore}`} />
							<KpiTile label="Click lift" value={`+${forecast.deltaClicksPerMonth}/mo`} />
						</div>
						<div className="text-[10px] text-[#444] italic">
							Confidence score: {Math.round(forecast.confidence * 100)}%
						</div>
					</div>
				</Card>
			)}

			{owners.length > 0 && (
				<Card padded={false} title="Owner load">
					<div className="flex flex-col border-t border-[#1f1f1f]">
						{owners.map(o => (
							<RowItem key={o.id} label={o.label} value={`${o.count}`} />
						))}
					</div>
				</Card>
			)}
		</div>
	)
}


