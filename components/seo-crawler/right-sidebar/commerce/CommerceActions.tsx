import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  TabbedAlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function CommerceActions() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Action band" segments={[
        { value: s.actions.critical, tone: 'bad', label: 'Critical' },
        { value: s.actions.high, tone: 'warn', label: 'High' },
        { value: s.actions.med, tone: 'info', label: 'Medium' },
        { value: s.actions.low, tone: 'neutral', label: 'Low' },
      ]} />
      <SegmentBlock title="By reason" headers={['Reason','Open','Done']} rows={s.actions.byReason.slice(0, 6).map((r: any) => ({
        id: r.id, label: r.label, values: [r.open, r.done],
      }))} />
      <TabbedAlertsBlock tabId="commerce" />
      <ActionsBlock tabId="commerce" max={12} />
      <DrillFooter chips={[
        { label: 'Critical', count: s.actions.critical }, { label: 'High', count: s.actions.high },
      ]} />
    </div>
  )
}
