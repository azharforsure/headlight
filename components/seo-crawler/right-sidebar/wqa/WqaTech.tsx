import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { Card } from '../_shared/Card'
import { Section } from '../_shared/Section'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/EmptyState'
import {
	selectIndexability, selectStatusCodes, selectRenderMix,
	selectResponseTime, selectCwvSample, selectStructural,
} from './_selectors'

export function WqaTech() {
	const { pages, openIssueDrawer } = useSeoCrawler() as any

	const idx = useMemo(() => selectIndexability(pages), [pages])
	const status = useMemo(() => selectStatusCodes(pages), [pages])
	const render = useMemo(() => selectRenderMix(pages), [pages])
	const rt = useMemo(() => selectResponseTime(pages), [pages])
	const cwv = useMemo(() => selectCwvSample(pages), [pages])
	const struct = useMemo(() => selectStructural(pages), [pages])

	if (!pages?.length) return <EmptyState label="No pages crawled yet" />

	const total = pages.length
	const statusTotal = status.ok + status.redirect + status.clientError + status.serverError || 1

	return (
		<div className="flex flex-col gap-3 p-3">
			<Card title="Indexability">
				<Distribution 
					total={100}
					rows={[
						{ label: 'Indexable', value: Math.round(idx.indexable * 100), tone: 'good' },
						{ label: 'Noindex', value: Math.round(idx.noindex * 100), tone: 'warn' },
						{ label: 'Blocked', value: Math.round(idx.blocked * 100), tone: 'bad' },
						{ label: 'Canon ≠ self', value: Math.round(idx.canonOff * 100), tone: undefined },
					]} 
				/>
			</Card>

			<Card title="Status codes">
				<Distribution 
					total={statusTotal}
					rows={[
						{ label: '200 OK', value: status.ok, color: '#22c55e' },
						{ label: '3xx Redirect', value: status.redirect, color: '#3b82f6' },
						{ label: '4xx Client', value: status.clientError, color: '#f59e0b' },
						{ label: '5xx Server', value: status.serverError, color: '#ef4444' },
					]} 
				/>
			</Card>

			<Card title="Render mix">
				<Distribution 
					total={100}
					rows={[
						{ label: 'Static', value: Math.round(render.staticHtml * 100), color: '#22c55e' },
						{ label: 'SSR', value: Math.round(render.ssr * 100), color: '#3b82f6' },
						{ label: 'CSR', value: Math.round(render.csr * 100), color: '#f59e0b', tone: render.csr > 0.15 ? 'warn' : undefined },
					]} 
				/>
			</Card>

			<div className="grid grid-cols-3 gap-2">
				<KpiTile label="p50" value={`${rt.p50}ms`} />
				<KpiTile label="p90" value={`${rt.p90}ms`} tone={rt.p90 > 2000 ? 'warn' : 'neutral'} />
				<KpiTile label="p99" value={`${rt.p99}ms`} tone={rt.p99 > 4000 ? 'bad' : 'neutral'} />
			</div>

			{cwv.length > 0 && (
				<>
					<div className="px-1 text-[10px] font-semibold uppercase tracking-widest text-[#666]">Core signals (template sample)</div>
					<div className="flex flex-col gap-2">
						{cwv.map(t => (
							<Card key={t.id}>
								<div className="flex flex-col gap-1.5">
									<div className="flex items-center justify-between text-[11px] text-[#aaa]">
										<span className="font-medium text-white">{t.label}</span>
										<span className="text-[#666]">{t.pages} pages</span>
									</div>
									<div className="grid grid-cols-3 gap-2 text-[10px]">
										<div className="flex flex-col">
											<span className="text-[#555] uppercase text-[9px]">LCP</span>
											<span className={tone(t.lcp, 2500, 4000)}>{(t.lcp / 1000).toFixed(1)}s</span>
										</div>
										<div className="flex flex-col">
											<span className="text-[#555] uppercase text-[9px]">INP</span>
											<span className={tone(t.inp, 200, 500)}>{t.inp}ms</span>
										</div>
										<div className="flex flex-col">
											<span className="text-[#555] uppercase text-[9px]">CLS</span>
											<span className={tone(t.cls * 1000, 100, 250)}>{t.cls.toFixed(2)}</span>
										</div>
									</div>
								</div>
							</Card>
						))}
					</div>
				</>
			)}

			<Card padded={false} title="Structural health">
				<div className="flex flex-col border-t border-[#1f1f1f]">
					<RowItem 
						label="Orphan pages" 
						value={String(struct.orphans)}
						onClick={() => openIssueDrawer?.('struct:orphans')}
						className={struct.orphans > 0 ? 'text-[#f59e0b]' : ''} 
					/>
					<RowItem 
						label="Deep pages (>5)" 
						value={String(struct.deep)}
						onClick={() => openIssueDrawer?.('struct:deep')}
						className={struct.deep > 0 ? 'text-[#f59e0b]' : ''} 
					/>
					<RowItem 
						label="Redirect chains" 
						value={String(struct.redirectChains)}
						className={struct.redirectChains > 0 ? 'text-[#f59e0b]' : ''} 
					/>
					<RowItem 
						label="Mixed content" 
						value={String(struct.mixedContent)}
						className={struct.mixedContent > 0 ? 'text-[#ef4444]' : ''} 
					/>
				</div>
			</Card>
		</div>
	)
}

function tone(v: number, ok: number, bad: number): string {
	if (v <= ok) return 'text-[#22c55e]'
	if (v <= bad) return 'text-[#f59e0b]'
	return 'text-[#ef4444]'
}

