import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket } from '../_shared/derive'

export function LinksVelocity() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Cadence mix" segments={[
        { value: s.velocity.daily, tone: 'good', label: 'Daily' },
        { value: s.velocity.weekly, tone: 'good', label: 'Weekly' },
        { value: s.velocity.monthly, tone: 'info', label: 'Monthly' },
        { value: s.velocity.spikes, tone: 'warn', label: 'Spikes' },
      ]} />
      <TrendBlock title="New refdoms (90d)" values={s.velocity.gainedSeries} tone="good" />
      <TrendBlock title="Lost refdoms (90d)" values={s.velocity.lostSeries} tone="bad" />
      <TopListBlock title="Latest gains" items={s.velocity.recentGains.slice(0, 6).map((g: any) => ({
        id: g.domain, primary: g.domain, secondary: g.targetUrl, tail: g.relTime,
        onClick: () => drill.toPage({ url: g.targetUrl }),
      }))} />
      <TopListBlock title="Latest losses" items={s.velocity.recentLosses.slice(0, 6).map((l: any) => ({
        id: l.domain, primary: l.domain, secondary: l.targetUrl, tail: l.relTime,
        onClick: () => drill.toPage({ url: l.targetUrl }),
      }))} emptyText="No recent losses" />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Gained', a: { v: s.velocity.gained30d, tag: 'now' }, b: { v: s.velocity.gainedPrev, tag: 'prev' } },
        { label: 'Lost', a: { v: s.velocity.lost30d, tag: 'now' }, b: { v: s.velocity.lostPrev, tag: 'prev' } },
      ]} />
      <DrillFooter chips={[
        { label: 'Gains', count: s.velocity.gained30d },
        { label: 'Losses', count: s.velocity.lost30d },
        { label: 'Spikes', count: s.velocity.spikes },
      ]} />
    </div>
  )
}
