import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function PaidSpend() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()
  const drill = useDrill()
  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  const top = [...paidCampaigns].sort((a, b) => Number(b.spend) - Number(a.spend)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Channel split" segments={[
        { value: s.byChannel.search, tone: 'good', label: 'Search' },
        { value: s.byChannel.display, tone: 'info', label: 'Display' },
        { value: s.byChannel.video, tone: 'info', label: 'Video' },
        { value: s.byChannel.shopping, tone: 'good', label: 'Shopping' },
        { value: s.byChannel.social, tone: 'info', label: 'Social' },
      ]} />
      <DistRowsBlock title="Spend tier" rows={[
        { label: '> $10k/mo', value: s.spendTiers.huge, tone: 'info' },
        { label: '$1k–10k', value: s.spendTiers.big, tone: 'info' },
        { label: '$100–1k', value: s.spendTiers.mid, tone: 'neutral' },
        { label: '< $100', value: s.spendTiers.tiny, tone: 'neutral' },
      ]} />
      <TrendBlock title="Spend (90d)" values={s.spendSeries90d} tone="info" />
      <TopListBlock title="Top campaigns" items={top.map(c => ({
        id: c.id, primary: c.name, secondary: c.channel,
        tail: fmtCurrency(Number(c.spend)),
      }))} />
      <TopListBlock title="Wasted spend" items={s.wasted.slice(0, 6).map((c: any) => ({
        id: c.id, primary: c.name, secondary: c.reason, tail: fmtCurrency(c.wastedAmount),
      }))} emptyText="No flagged waste" />
      <SegmentBlock title="By account" headers={['Account','Spend','Conv','CPA']} rows={s.byAccount.slice(0, 6).map((a: any) => ({
        id: a.id, label: a.name, values: [fmtCurrency(a.spend), a.conv, fmtCurrency(a.cpa)],
      }))} />
      <BenchmarkBlock title="CPC vs vertical" site={s.cpc} benchmark={s.bench.cpc} unit="$" higherIsBetter={false} />
      <DrillFooter chips={[
        { label: 'Wasted', count: fmtCurrency(s.wastedTotal) },
        { label: 'Pacing', count: fmtPct(s.pacing * 100) },
      ]} />
    </div>
  )
}
