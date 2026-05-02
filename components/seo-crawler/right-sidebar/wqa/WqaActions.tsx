import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  TabbedAlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function WqaActions() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Action band" segments={[
        { value: s.actions.critical, tone: 'bad', label: 'Critical' },
        { value: s.actions.high, tone: 'warn', label: 'High' },
        { value: s.actions.med, tone: 'info', label: 'Medium' },
        { value: s.actions.low, tone: 'neutral', label: 'Low' },
      ]} />
      <TrendBlock title="Closed (30d)" values={s.actions.doneSeries} tone="good" />
      <SegmentBlock title="By reason" headers={['Reason', 'Open', 'Done']} rows={s.actions.byReason.slice(0, 6).map((r: any) => ({
        id: r.id, label: r.label, values: [r.open, r.done],
      }))} />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'Open', a: { v: s.actions.open, tag: 'now' }, b: { v: s.actions.openPrev, tag: 'prev' } },
        { label: 'Done', a: { v: s.actions.done, tag: 'now' }, b: { v: s.actions.donePrev, tag: 'prev' } },
      ]} />
      <TabbedAlertsBlock tabId="wqa" />
      <ActionsBlock tabId="wqa" max={12} />
      <DrillFooter chips={[
        { label: 'Critical', count: s.actions.critical },
        { label: 'High', count: s.actions.high },
      ]} />
    </div>
  )
}
