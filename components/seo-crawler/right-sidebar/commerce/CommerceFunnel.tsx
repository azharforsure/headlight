import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function CommerceFunnel() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <FunnelBlock title="Sessions → Order" steps={s.funnel.slice(0, 6)} />
      <DistBlock title="Step health" segments={[
        { value: s.funnelHealth.healthy, tone: 'good', label: 'Healthy' },
        { value: s.funnelHealth.dropping, tone: 'warn', label: 'Dropping' },
        { value: s.funnelHealth.broken, tone: 'bad', label: 'Broken' },
      ]} />
      <DistRowsBlock title="Drop reasons (checkout)" rows={[
        { label: 'Shipping cost', value: s.funnelKpi.dropReasons.shipping, tone: 'warn' },
        { label: 'Account required', value: s.funnelKpi.dropReasons.account, tone: 'warn' },
        { label: 'Payment failure', value: s.funnelKpi.dropReasons.payment, tone: 'bad' },
        { label: 'Slow page', value: s.funnelKpi.dropReasons.slow, tone: 'warn' },
      ]} />
      <TrendBlock title="Order rate (30d)" values={s.funnelKpi.orderSeries} tone="info" />
      <SegmentBlock title="By device" headers={['Device','Sessions','ATC','Order']} rows={s.funnelKpi.byDevice.slice(0, 6).map((d: any) => ({
        id: d.id, label: d.label, values: [compactNum(d.sessions), fmtPct(d.atc * 100), fmtPct(d.order * 100)],
      }))} />
      <DrillFooter chips={[
        { label: 'Drops', count: s.funnelDrops },
        { label: 'Mobile', count: compactNum(s.funnelKpi.mobileSessions) },
      ]} />
    </div>
  )
}
