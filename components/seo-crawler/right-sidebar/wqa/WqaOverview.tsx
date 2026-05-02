import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { RowItem } from '../_shared/RowItem'
import { DeltaChip } from '../_shared/DeltaChip'
import { EmptyState } from '../_shared/EmptyState'
import { SourceTag } from '../_shared/SourceTag'
import {
	selectQualityScore, selectCategoryKpis, selectQualityDistribution,
	selectCategoryDonut, selectSearchSnapshot, selectDecisions,
} from './_selectors'

export function WqaOverview() {
	const { pages, sessions, site, scoreSpark, openIssueDrawer } = useSeoCrawler() as any
	const hasTrend = useHasTrend()

	const score = useMemo(() => selectQualityScore(pages, sessions), [pages, sessions])
	const kpis = useMemo(() => selectCategoryKpis(pages, site?.industry), [pages, site?.industry])
	const dist = useMemo(() => selectQualityDistribution(pages), [pages])
	const donut = useMemo(() => selectCategoryDonut(pages), [pages])
	const search = useMemo(() => selectSearchSnapshot(pages, sessions), [pages, sessions])
	const decisions = useMemo(() => selectDecisions(pages), [pages])

	if (!pages?.length) return <EmptyState label="No pages crawled yet" />

	return (
		<div className="flex flex-col gap-3 p-3">
			{/* Score gauge - Matching Full Audit Style */}
			<Card>
				<div className="flex items-center justify-between gap-3">
					<div>
						<div className="text-[11px] uppercase tracking-wide text-[#888]">Quality score</div>
						<div className="mt-1 text-2xl font-semibold text-white">{score.score}</div>
						<div className="mt-1.5 flex flex-col gap-1.5">
							<div className="flex items-center gap-2 text-[10px] text-[#666]">
								<span>p50 <span className="text-[#aaa]">{score.p50}</span></span>
								<span className="w-px h-2 bg-[#222]" />
								<span>p90 <span className="text-[#aaa]">{score.p90}</span></span>
							</div>
							{hasTrend && score.prevScore != null && (
								<DeltaChip value={score.score - score.prevScore} size="sm" />
							)}
						</div>
					</div>
					<ProgressRing value={score.score} max={100} size={72} />
				</div>
			</Card>

			{/* Category KPIs (industry-adaptive) */}
			<div className="grid grid-cols-2 gap-2">
				{kpis.map(k => (
					<KpiTile 
						key={k.label} 
						label={k.label} 
						value={k.value} 
						tone={k.tone === 'good' ? 'good' : k.tone === 'bad' ? 'bad' : 'neutral'} 
					/>
				))}
			</div>

			{/* Quality distribution */}
			<Card title="Quality distribution">
				<Distribution rows={dist.map(b => ({ label: b.label, value: b.count, color: b.tone === 'good' ? '#22c55e' : b.tone === 'bad' ? '#ef4444' : '#f59e0b' }))} />
			</Card>

			{/* Page categories */}
			<Card title="Page categories">
				<Distribution rows={donut.slice(0, 6).map(c => ({ label: c.label, value: c.count, color: c.color }))} />
			</Card>

			{/* Search snapshot */}
			<div className="grid grid-cols-2 gap-2">
				<KpiTile label="Clicks" value={fmtCompact(search.clicks)} delta={hasTrend ? search.clicksDelta : undefined} />
				<KpiTile label="Impr" value={fmtCompact(search.impr)} delta={hasTrend ? search.imprDelta : undefined} />
				<KpiTile label="CTR" value={`${(search.ctr * 100).toFixed(1)}%`} delta={hasTrend ? search.ctrDeltaPt : undefined} />
				<KpiTile label="Pos" value={search.pos.toFixed(1)} delta={hasTrend ? search.posDelta : undefined} />
			</div>

			{/* Decisions queue */}
			<Card padded={false} title={`Needs decision · ${decisions.total}`}>
				<div className="flex flex-col border-t border-[#1f1f1f]">
					{decisions.rows.map(r => (
						<RowItem
							key={r.id}
							label={r.label}
							value={String(r.count)}
							onClick={() => openIssueDrawer?.(`decision:${r.id}`)}
						/>
					))}
				</div>
			</Card>
		</div>
	)
}

function fmtCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
	return String(n)
}
