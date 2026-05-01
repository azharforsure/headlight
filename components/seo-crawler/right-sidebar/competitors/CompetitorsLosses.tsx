import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function CompetitorsLosses() {
  const { competitors } = useSeoCrawler() as any
  const s = useCompetitorsInsights()
  if (!competitors?.length) return <EmptyState title="No competitors set" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Loss type" segments={[
        { value: s.losses.byType.position, tone: 'bad', label: 'Position' },
        { value: s.losses.byType.feature, tone: 'warn', label: 'SERP feature' },
        { value: s.losses.byType.snippet, tone: 'warn', label: 'Snippet' },
        { value: s.losses.byType.dropped, tone: 'bad', label: 'Dropped out' },
      ]} />
      <TrendBlock title="Losses (90d)" values={s.losses.series} tone="bad" />
      <TopListBlock title="Recent losses" items={s.losses.recent.slice(0, 6).map((l: any) => ({
        id: l.id, primary: l.keyword, secondary: l.url, tail: `${l.delta}`,
      }))} emptyText="No recent losses" />
      <SegmentBlock title="To which competitors" headers={['Competitor','Losses','Traffic lost','Avg Δ']} rows={s.losses.byCompetitor.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.domain, values: [c.losses, compactNum(c.trafficLost), c.avgDelta.toFixed(1)],
      }))} />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Losses', a: { v: s.losses.total, tag: 'now' }, b: { v: s.losses.totalPrev, tag: 'prev' } },
        { label: 'Traffic lost', a: { v: s.losses.trafficLost, tag: 'now' }, b: { v: s.losses.trafficLostPrev, tag: 'prev' }, format: compactNum },
      ]} />
      <DrillFooter chips={[
        { label: 'Dropped out', count: s.losses.byType.dropped },
        { label: 'Position', count: s.losses.byType.position },
      ]} />
    </div>
  )
}
