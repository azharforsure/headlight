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

export function PaidQualityScore() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()
  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="QS distribution" segments={[
        { value: s.qs.dist[1] || 0, tone: 'bad', label: '1' },
        { value: s.qs.dist[2] || 0, tone: 'bad', label: '2' },
        { value: s.qs.dist[3] || 0, tone: 'bad', label: '3' },
        { value: s.qs.dist[4] || 0, tone: 'warn', label: '4' },
        { value: s.qs.dist[5] || 0, tone: 'warn', label: '5' },
        { value: s.qs.dist[6] || 0, tone: 'info', label: '6' },
        { value: s.qs.dist[7] || 0, tone: 'info', label: '7' },
        { value: s.qs.dist[8] || 0, tone: 'good', label: '8' },
        { value: s.qs.dist[9] || 0, tone: 'good', label: '9' },
        { value: s.qs.dist[10] || 0, tone: 'good', label: '10' },
      ]} />
      <DistRowsBlock title="Component mix" rows={[
        { label: 'Expected CTR', value: s.qs.expectedCtr.toFixed(1), tone: scoreToTone(s.qs.expectedCtr * 10) },
        { label: 'Ad relevance', value: s.qs.adRelevance.toFixed(1), tone: scoreToTone(s.qs.adRelevance * 10) },
        { label: 'Landing page', value: s.qs.landingPage.toFixed(1), tone: scoreToTone(s.qs.landingPage * 10) },
      ]} />
      <TrendBlock title="Avg QS (12 weeks)" values={s.qs.series} tone="info" />
      <TopListBlock title="Worst keywords" items={s.qs.worstKeywords.slice(0, 6).map((k: any) => ({
        id: k.id, primary: k.text, tail: `QS ${k.qs} · ${fmtCurrency(k.spend)}`,
      }))} />
      <SegmentBlock title="By campaign" headers={['Campaign','Avg QS','Worst','% < 5']} rows={s.qs.byCampaign.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.name, values: [c.avg.toFixed(1), c.worst, fmtPct(c.below5Pct * 100)],
      }))} />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Avg QS', a: { v: s.avgQs, tag: 'now' }, b: { v: s.avgQsPrev, tag: 'prev' }, format: v => v.toFixed(1) },
        { label: 'Below 5', a: { v: s.qs.below5, tag: 'now' }, b: { v: s.qs.below5Prev, tag: 'prev' } },
      ]} />
      <DrillFooter chips={[
        { label: 'Below 5', count: s.qs.below5 }, { label: 'Above 8', count: s.qs.above8 },
      ]} />
    </div>
  )
}
