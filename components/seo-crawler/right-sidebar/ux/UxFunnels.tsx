import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket } from '../_shared/derive'

export function UxFunnels() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worstStep = s.funnels.worstStep || { name: '—', dropPct: 0 }

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Step health" segments={[
        { value: s.funnels.healthy, tone: 'good', label: 'Healthy' },
        { value: s.funnels.dropping, tone: 'warn', label: 'Dropping' },
        { value: s.funnels.broken, tone: 'bad', label: 'Broken' },
      ]} />
      <FunnelBlock title="Primary funnel" steps={s.funnels.primary.slice(0, 6)} />
      <FunnelBlock title="Secondary funnel" steps={s.funnels.secondary.slice(0, 6)} />
      <SegmentBlock title="Funnels list" headers={['Funnel','Steps','Completion','Worst step']} rows={s.funnels.list.slice(0, 6).map((f: any) => ({
        id: f.id, label: f.name, values: [f.steps, fmtPct(f.completion * 100), f.worstStep],
      }))} />
      <TrendBlock title="Completion (30d)" values={s.funnels.completionSeries} tone="info" />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Avg completion', a: { v: s.funnels.avgCompletion * 100, tag: 'now' }, b: { v: s.funnels.avgCompletionPrev * 100, tag: 'prev' }, format: fmtPct },
      ]} />
      <DrillFooter chips={[
        { label: 'Funnels', count: s.funnels.list.length },
        { label: 'Drops', count: s.funnels.dropping },
      ]} />
    </div>
  )
}
