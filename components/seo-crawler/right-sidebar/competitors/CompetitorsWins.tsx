import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function CompetitorsWins() {
  const { competitors } = useSeoCrawler() as any
  const s = useCompetitorsInsights()
  if (!competitors?.length) return <EmptyState title="No competitors set" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Win type" segments={[
        { value: s.wins.byType.position, tone: 'good', label: 'Position' },
        { value: s.wins.byType.feature, tone: 'good', label: 'SERP feature' },
        { value: s.wins.byType.snippet, tone: 'good', label: 'Snippet' },
        { value: s.wins.byType.image, tone: 'info', label: 'Image' },
      ]} />
      <TrendBlock title="Wins (90d)" values={s.wins.series} tone="good" />
      <TopListBlock title="Recent wins" items={s.wins.recent.slice(0, 6).map((w: any) => ({
        id: w.id, primary: w.keyword, secondary: w.url,
        tail: `+${w.delta}`,
      }))} emptyText="No recent wins" />
      <SegmentBlock title="By topic" headers={['Topic','Wins','Traffic gain','Avg Δ']} rows={s.wins.byTopic.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.wins, compactNum(t.trafficGain), `+${t.avgDelta.toFixed(1)}`],
      }))} />
      <BenchmarkBlock title="Win rate vs market" site={s.wins.rate * 100} benchmark={s.bench.winRate * 100} unit="%" higherIsBetter />
      <DrillFooter chips={[
        { label: 'Position wins', count: s.wins.byType.position },
        { label: 'SERP features', count: s.wins.byType.feature },
      ]} />
    </div>
  )
}
