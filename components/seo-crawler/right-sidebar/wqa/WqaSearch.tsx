import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { Card } from '../_shared/Card'
import { RowItem } from '../_shared/RowItem'
import { DeltaChip } from '../_shared/DeltaChip'
import { EmptyState } from '../_shared/EmptyState'
import { SourceTag } from '../_shared/SourceTag'
import { RsSparkline } from '../parts/RsSparkline'
import {
	selectSearchSnapshot, selectKwBuckets, selectCtrVsBenchmark,
	selectMovers, selectLostPages,
} from './_selectors'

export function WqaSearch() {
	const { pages, sessions, site, drillToPage } = useSeoCrawler() as any
	const hasTrend = useHasTrend()

	const snap = useMemo(() => selectSearchSnapshot(pages, sessions), [pages, sessions])
	const buckets = useMemo(() => selectKwBuckets(pages), [pages])
	const ctr = useMemo(() => selectCtrVsBenchmark(pages), [pages])
	const movers = useMemo(() => selectMovers(pages), [pages])
	const lost = useMemo(() => selectLostPages(pages), [pages])

	if (!pages?.length) return <EmptyState label="No pages crawled yet" />

	const sources = Object.entries(site?.connectors || {})
		.map(([id, val]: [string, any]) => ({ id, state: val?.state || val }))
		.filter(c => ['gsc', 'bing'].includes(c.id))

	return (
		<div className="flex flex-col gap-3 p-3">
			{/* Sources */}
			<div className="flex items-center gap-2 px-1">
				<span className="text-[11px] text-[#666] font-medium uppercase tracking-wider">Sources</span>
				{sources.length === 0
					? <span className="text-[11px] text-[#666]">none connected</span>
					: sources.map(s => <SourceTag key={s.id} id={s.id} state={s.state} />)
				}
			</div>

			{/* Sparklines + KPIs */}
			<Card>
				<div className="flex flex-col gap-5">
					<KpiSpark label="Clicks" value={fmtCompact(snap.clicks)}
						series={hasTrend ? extractSeries(sessions, 'clicks') : []}
						delta={hasTrend ? snap.clicksDelta : null} />
					<KpiSpark label="Impressions" value={fmtCompact(snap.impr)}
						series={hasTrend ? extractSeries(sessions, 'impr') : []}
						delta={hasTrend ? snap.imprDelta : null} />
					<KpiSpark label="Average CTR" value={`${(snap.ctr * 100).toFixed(1)}%`}
						series={hasTrend ? extractSeries(sessions, 'ctr') : []}
						delta={hasTrend ? snap.ctrDeltaPt : null} suffix="pt" />
					<KpiSpark label="Average Position" value={snap.pos.toFixed(1)}
						series={hasTrend ? extractSeries(sessions, 'pos') : []}
						delta={hasTrend ? snap.posDelta : null} invertTone />
				</div>
			</Card>

			{/* Keyword buckets */}
			<Card padded={false} title="Keyword buckets">
				<div className="flex flex-col border-t border-[#1f1f1f]">
					<RowItem label="Ranking" value={String(buckets.ranking)} />
					<RowItem label="Top 3" value={String(buckets.top3)} />
					<RowItem label="Top 10" value={String(buckets.top10)} />
					<RowItem label="Striking (11-20)" value={String(buckets.striking)} />
					<RowItem label="Tail (21-50)" value={String(buckets.tail)} />
					<RowItem label="Not ranking" value={String(buckets.notRanking)} />
				</div>
			</Card>

			{/* CTR vs benchmark */}
			{ctr.length > 0 && (
				<Card padded={false} title="CTR vs benchmark">
					<div className="flex flex-col border-t border-[#1f1f1f]">
						{ctr.map(r => (
							<RowItem
								key={r.pos}
								label={`Position ${r.pos}`}
								value={`${(r.us * 100).toFixed(0)}% vs ${(r.bench * 100).toFixed(0)}%`}
								className={r.us < r.bench * 0.7 ? 'text-[#ef4444]' : r.us < r.bench ? 'text-[#f59e0b]' : 'text-[#22c55e]'}
							/>
						))}
					</div>
				</Card>
			)}

			{/* Movers — only if multiple sessions */}
			{hasTrend && (movers.up.length > 0 || movers.down.length > 0) && (
				<Card padded={false} title="Movers (28d)">
					<div className="flex flex-col border-t border-[#1f1f1f]">
						{movers.up.map(m => (
							<RowItem key={`u-${m.id}`} label={m.label}
								value={`▲ +${m.delta}`} className="text-[#22c55e]" onClick={() => drillToPage?.(m.id)} />
						))}
						{movers.down.map(m => (
							<RowItem key={`d-${m.id}`} label={m.label}
								value={`▼ ${m.delta}`} className="text-[#ef4444]" onClick={() => drillToPage?.(m.id)} />
						))}
					</div>
				</Card>
			)}

			{/* Lost pages — only if multiple sessions */}
			{hasTrend && lost.length > 0 && (
				<Card padded={false} title="Lost (top 50)">
					<div className="flex flex-col border-t border-[#1f1f1f]">
						{lost.map(p => (
							<RowItem key={p.id} label={p.label} onClick={() => drillToPage?.(p.id)} />
						))}
					</div>
				</Card>
			)}
		</div>
	)
}

function KpiSpark({ label, value, series, delta, suffix, invertTone }: {
	label: string; value: string; series: number[]; delta: number | null; suffix?: string; invertTone?: boolean
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex flex-col">
				<span className="text-[10px] font-semibold uppercase tracking-widest text-[#666]">{label}</span>
				<span className="mt-0.5 text-[17px] font-semibold text-[#fff] tabular-nums">{value}</span>
			</div>
			<div className="flex items-center gap-3">
				{series.length > 0 && (
					<div className="w-24 h-8 opacity-80"><RsSparkline points={series} /></div>
				)}
				{delta != null && <DeltaChip value={delta} suffix={suffix} invertTone={invertTone} size="sm" />}
			</div>
		</div>
	)
}

function extractSeries(sessions: any[], key: string): number[] {
	if (!sessions?.length) return []
	return sessions.slice(-12).map(s => Number(s.summary?.search?.[key] ?? 0))
}

function fmtCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
	return String(n)
}


