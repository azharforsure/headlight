import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function FullAuditActions() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Action band mix" segments={[
        { value: s.actions.critical, tone: 'bad', label: 'Critical' },
        { value: s.actions.high, tone: 'warn', label: 'High' },
        { value: s.actions.med, tone: 'info', label: 'Medium' },
        { value: s.actions.low, tone: 'neutral', label: 'Low' },
      ]} />
      <TrendBlock title="Actions completed (30d)" values={s.actions.doneSeries} tone="good" />
      <SegmentBlock title="By category" headers={['Category', 'Open', 'Done', 'Snoozed']} rows={s.actions.byCategory.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [c.open, c.done, c.snoozed],
      }))} />
      <AlertsBlock tabId="fullAudit" />
      <ActionsBlock tabId="fullAudit" max={12} />
      <DrillFooter chips={[
        { label: 'Critical', count: s.actions.critical },
        { label: 'High', count: s.actions.high },
        { label: 'All', count: s.actions.open },
      ]} />
    </div>
  )
}
