import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineList, DrillFooter,
  TabbedAlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function TechnicalActions() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Action band" segments={[
        { value: s.actions.critical, tone: 'bad', label: 'Critical' },
        { value: s.actions.high, tone: 'warn', label: 'High' },
        { value: s.actions.med, tone: 'info', label: 'Medium' },
        { value: s.actions.low, tone: 'neutral', label: 'Low' },
      ]} />
      <SegmentBlock title="By category" headers={['Category','Open','Done']} rows={s.actions.byCategory.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [c.open, c.done],
      }))} />
      <TabbedAlertsBlock tabId="technical" />
      <ActionsBlock tabId="technical" max={12} />
      <DrillFooter chips={[
        { label: 'Critical', count: s.actions.critical },
        { label: 'High', count: s.actions.high },
      ]} />
    </div>
  )
}
