import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { Card } from '../_shared/Card'
import { Distribution } from '../_shared/Distribution'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/EmptyState'
import {
	selectWordsDistribution, selectReadability, selectFreshness,
	selectDuplication, selectEeat, selectContentSchema,
} from './_selectors'

export function WqaContent() {
	const { pages, openIssueDrawer } = useSeoCrawler() as any

	const words = useMemo(() => selectWordsDistribution(pages), [pages])
	const read = useMemo(() => selectReadability(pages), [pages])
	const fresh = useMemo(() => selectFreshness(pages), [pages])
	const dup = useMemo(() => selectDuplication(pages), [pages])
	const eeat = useMemo(() => selectEeat(pages), [pages])
	const schema = useMemo(() => selectContentSchema(pages), [pages])

	if (!pages?.length) return <EmptyState label="No pages crawled yet" />

	const total = pages.length

	return (
		<div className="flex flex-col gap-3 p-3">
			<Card title="Words per page">
				<Distribution 
					total={total}
					rows={words.map(b => ({ label: b.label, value: b.count, tone: b.tone as any }))} 
				/>
			</Card>

			<Card title={`Readability · avg ${read.avg}`}>
				<Distribution 
					total={total}
					rows={[
						{ label: 'Hard (<40)', value: read.hard, tone: 'bad' },
						{ label: 'Medium (40-60)', value: read.medium, tone: 'warn' },
						{ label: 'Easy (60-80)', value: read.easy, tone: 'good' },
						{ label: 'Very easy (80+)', value: read.veryEasy, tone: 'good' },
					]} 
				/>
			</Card>

			<Card title="Freshness">
				<Distribution 
					total={total}
					rows={fresh.map(b => ({ label: b.label, value: b.count, tone: b.tone as any }))} 
				/>
			</Card>

			<Card padded={false} title="Duplication">
				<div className="flex flex-col border-t border-[#1f1f1f]">
					<RowItem label="Near-dupe groups" value={String(dup.nearDupeGroups)}
						onClick={() => openIssueDrawer?.('dup:near')} />
					<RowItem label="Cannibal pairs" value={String(dup.cannibalPairs)}
						onClick={() => openIssueDrawer?.('dup:cannibal')} />
					<RowItem label="Exact dupes" value={String(dup.exactDupes)}
						onClick={() => openIssueDrawer?.('dup:exact')} />
				</div>
			</Card>

			<Card title="E-E-A-T coverage">
				<Distribution 
					total={100}
					rows={[
						{ label: 'Author bylines', value: Math.round(eeat.byline * 100), tone: eeat.byline >= 0.6 ? 'good' : 'warn' },
						{ label: 'Author bios', value: Math.round(eeat.bio * 100), tone: eeat.bio >= 0.4 ? 'good' : 'bad' },
						{ label: 'Citations', value: Math.round(eeat.citations * 100), tone: eeat.citations >= 0.5 ? 'good' : 'warn' },
						{ label: 'Updated visible', value: Math.round(eeat.updatedVisible * 100), tone: undefined },
					]} 
				/>
			</Card>

			<Card title="Content schema mix">
				<Distribution 
					total={100}
					rows={[
						{ label: 'Article', value: Math.round(schema.article * 100), color: '#f59e0b' },
						{ label: 'FAQ', value: Math.round(schema.faq * 100), color: '#3b82f6' },
						{ label: 'HowTo', value: Math.round(schema.howto * 100), color: '#a78bfa' },
						{ label: 'Product', value: Math.round(schema.product * 100), color: '#10b981' },
					]} 
				/>
			</Card>
		</div>
	)
}


