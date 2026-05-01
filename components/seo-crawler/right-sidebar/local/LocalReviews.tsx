import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function LocalReviews() {
  const { locations, reviewSources } = useSeoCrawler() as any
  const s = useLocalInsights()
  if (!locations?.length) return <EmptyState title="No locations set" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Rating mix" segments={[
        { value: s.reviews.dist[5] || 0, tone: 'good', label: '5★' },
        { value: s.reviews.dist[4] || 0, tone: 'good', label: '4★' },
        { value: s.reviews.dist[3] || 0, tone: 'info', label: '3★' },
        { value: s.reviews.dist[2] || 0, tone: 'warn', label: '2★' },
        { value: s.reviews.dist[1] || 0, tone: 'bad', label: '1★' },
      ]} />
      <DistRowsBlock title="Source mix" rows={(reviewSources || []).slice(0, 6).map((r: any) => ({
        label: r.name, value: r.count, tone: 'info',
      }))} />
      <TrendBlock title="Review velocity (12 weeks)" values={s.reviews.velocitySeries} tone="info" />
      <TopListBlock title="Recent low-star" items={s.reviews.recentLow.slice(0, 6).map((r: any) => ({
        id: r.id, primary: r.author, secondary: r.text.slice(0, 80),
        tail: `${r.rating}★ · ${r.location}`,
      }))} emptyText="No recent low-star" />
      <TopListBlock title="Unanswered reviews" items={s.reviews.unanswered.slice(0, 6).map((r: any) => ({
        id: r.id, primary: r.author, secondary: r.text.slice(0, 80), tail: `${r.rating}★`,
      }))} emptyText="All replied" />
      <SegmentBlock title="By location" headers={['Location','Avg','Count','Response %']} rows={s.byLocation.slice(0, 6).map((l: any) => ({
        id: l.id, label: l.name, values: [l.avgRating.toFixed(2), l.reviewCount, fmtPct(l.responseRate * 100)],
      }))} />
      <BenchmarkBlock title="Avg rating vs vertical" site={s.reviews.avg * 20} benchmark={s.bench.reviewAvg * 20} unit="%" higherIsBetter />
      <DrillFooter chips={[
        { label: 'Unanswered', count: s.reviews.unanswered.length },
        { label: 'Low star', count: s.reviews.lowStarTotal },
      ]} />
    </div>
  )
}
