import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function ContentFreshness() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const stalest = [...pages].filter(p => p.daysSinceUpdate && Number(p.gscClicks) > 10)
    .sort((a, b) => Number(b.daysSinceUpdate) - Number(a.daysSinceUpdate)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistRowsBlock title="Age band" rows={[
        { label: '<30d', value: s.freshness.fresh, tone: 'good' },
        { label: '30–90d', value: s.freshness.recent, tone: 'good' },
        { label: '90–180d', value: s.freshness.ok, tone: 'info' },
        { label: '180–365d', value: s.freshness.aging, tone: 'warn' },
        { label: '>1y', value: s.freshness.stale, tone: 'bad' },
      ]} />
      <DistBlock title="Update cadence" segments={[
        { value: s.freshness.weekly, tone: 'good', label: 'Weekly+' },
        { value: s.freshness.monthly, tone: 'good', label: 'Monthly' },
        { value: s.freshness.quarterly, tone: 'info', label: 'Quarterly' },
        { value: s.freshness.yearly, tone: 'warn', label: 'Yearly' },
        { value: s.freshness.never, tone: 'bad', label: 'Never' },
      ]} />
      <TrendBlock title="Publish velocity (12 weeks)" values={s.freshness.publishSeries} tone="info" />
      <TopListBlock title="Stalest revenue pages" items={stalest.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${p.daysSinceUpdate}d · ${p.gscClicks} clicks`,
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By cluster" headers={['Cluster','Pages','Stale','Avg age']} rows={s.freshness.byCluster.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [c.pages, c.stale, `${c.avgDays.toFixed(0)}d`],
      }))} />
      <DrillFooter chips={[
        { label: 'Stale', count: s.freshness.stale }, { label: 'Fresh', count: s.freshness.fresh },
      ]} />
    </div>
  )
}
