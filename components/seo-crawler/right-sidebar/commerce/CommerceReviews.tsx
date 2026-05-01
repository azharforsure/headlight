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

export function CommerceReviews() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Rating mix" segments={[
        { value: s.reviews.dist[5] || 0, tone: 'good', label: '5★' },
        { value: s.reviews.dist[4] || 0, tone: 'good', label: '4★' },
        { value: s.reviews.dist[3] || 0, tone: 'info', label: '3★' },
        { value: s.reviews.dist[2] || 0, tone: 'warn', label: '2★' },
        { value: s.reviews.dist[1] || 0, tone: 'bad', label: '1★' },
      ]} />
      <DistRowsBlock title="Review source" rows={[
        { label: 'Site', value: s.reviews.bySource.site },
        { label: 'Trustpilot', value: s.reviews.bySource.trustpilot },
        { label: 'Google', value: s.reviews.bySource.google },
        { label: 'Other', value: s.reviews.bySource.other },
      ]} />
      <TrendBlock title="Avg rating (12 weeks)" values={s.reviews.ratingSeries} tone="info" />
      <TopListBlock title="Worst-reviewed products" items={s.reviews.worstProducts.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: `${p.avgRating.toFixed(2)} · ${p.reviewCount}`,
        onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Recent low-star reviews" items={s.reviews.recentLow.slice(0, 6).map((r: any) => ({
        id: r.id, primary: r.title || r.text.slice(0, 60),
        secondary: r.productTitle, tail: `${r.rating}★`,
      }))} emptyText="No recent low-star" />
      <SegmentBlock title="By category" headers={['Category','Avg rating','Reviews','% < 3']} rows={s.reviews.byCategory.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [c.avgRating.toFixed(2), c.count, fmtPct(c.lowSharePct * 100)],
      }))} />
      <DrillFooter chips={[
        { label: 'Low star', count: s.reviews.lowStar },
        { label: 'No reviews', count: s.reviews.noReviewProducts },
      ]} />
    </div>
  )
}
