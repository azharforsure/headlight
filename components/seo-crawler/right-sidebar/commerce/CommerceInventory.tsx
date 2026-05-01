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

export function CommerceInventory() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const oos = s.products.outOfStockList.slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Stock band" segments={[
        { value: s.products.inStock, tone: 'good', label: 'In stock' },
        { value: s.products.lowStock, tone: 'warn', label: 'Low' },
        { value: s.products.outOfStock, tone: 'bad', label: 'OOS' },
        { value: s.products.discontinued, tone: 'neutral', label: 'Discontinued' },
      ]} />
      <DistRowsBlock title="OOS impact" rows={[
        { label: 'OOS with traffic', value: s.inventory.oosWithTraffic, tone: 'bad' },
        { label: 'OOS with backlinks', value: s.inventory.oosWithBacklinks, tone: 'warn' },
        { label: 'OOS in sitemap', value: s.inventory.oosInSitemap, tone: 'warn' },
      ]} />
      <TrendBlock title="OOS count (90d)" values={s.inventory.oosSeries} tone="warn" />
      <TopListBlock title="OOS with most traffic" items={oos.map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: compactNum(p.gscClicks),
        onClick: () => drill.toPage(p),
      }))} emptyText="No OOS" />
      <TopListBlock title="Recent restocks" items={s.inventory.recentRestock.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: p.relTime,
      }))} emptyText="No recent restocks" />
      <SegmentBlock title="By category" headers={['Category','OOS','Low','Avg days OOS']} rows={s.inventory.byCategory.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [c.oos, c.low, c.avgDaysOos],
      }))} />
      <DrillFooter chips={[
        { label: 'OOS', count: s.products.outOfStock },
        { label: 'OOS traffic', count: s.inventory.oosWithTraffic },
      ]} />
    </div>
  )
}
