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

export function CommerceFeed() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Feed status" segments={[
        { value: s.feed.approved, tone: 'good', label: 'Approved' },
        { value: s.feed.pending, tone: 'warn', label: 'Pending' },
        { value: s.feed.disapproved, tone: 'bad', label: 'Disapproved' },
        { value: s.feed.expired, tone: 'neutral', label: 'Expired' },
      ]} />
      <DistRowsBlock title="Disapproval reasons" rows={[
        { label: 'Price mismatch', value: s.feed.reasons.priceMismatch, tone: 'bad' },
        { label: 'Availability mismatch', value: s.feed.reasons.availMismatch, tone: 'bad' },
        { label: 'Image issues', value: s.feed.reasons.image, tone: 'warn' },
        { label: 'Title/desc policy', value: s.feed.reasons.policy, tone: 'warn' },
        { label: 'GTIN missing', value: s.feed.reasons.gtin, tone: 'warn' },
      ]} />
      <TopListBlock title="Disapproved items" items={s.feed.disapprovedList.slice(0, 6).map((i: any) => ({
        id: i.id, primary: i.title, secondary: i.reason, tail: i.merchant,
      }))} emptyText="No disapprovals" />
      <SegmentBlock title="By merchant" headers={['Merchant','Items','Disapproved']} rows={s.feed.byMerchant.slice(0, 6).map((m: any) => ({
        id: m.id, label: m.name, values: [m.items, m.disapproved],
      }))} />
      <DrillFooter chips={[
        { label: 'Disapproved', count: s.feed.disapproved },
        { label: 'Pending', count: s.feed.pending },
      ]} />
    </div>
  )
}
