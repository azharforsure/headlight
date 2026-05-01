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

export function UxTests() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Status mix" segments={[
        { value: s.tests.active, tone: 'info', label: 'Active' },
        { value: s.tests.won, tone: 'good', label: 'Won' },
        { value: s.tests.lost, tone: 'warn', label: 'Lost' },
        { value: s.tests.inconclusive, tone: 'neutral', label: 'Inconclusive' },
      ]} />
      <DistRowsBlock title="Test type" rows={[
        { label: 'A/B', value: s.tests.byType.ab, tone: 'info' },
        { label: 'Multivariate', value: s.tests.byType.mvt, tone: 'info' },
        { label: 'Personalize', value: s.tests.byType.personalize, tone: 'info' },
      ]} />
      <TopListBlock title="Recent winners" items={s.tests.recentWins.slice(0, 6).map((t: any) => ({
        id: t.id, primary: t.name, tail: `+${fmtPct(t.lift * 100)}`,
      }))} />
      <TopListBlock title="Active tests" items={s.tests.activeList.slice(0, 6).map((t: any) => ({
        id: t.id, primary: t.name, secondary: t.targetUrl,
        tail: `${t.daysRunning}d · ${fmtPct(t.confidence * 100)}`,
        onClick: () => drill.toPage({ url: t.targetUrl }),
      }))} />
      <SegmentBlock title="By page" headers={['Page','Tests','Wins','Lifts']} rows={s.tests.byPage.slice(0, 6).map((p: any) => ({
        id: p.url, label: p.title || p.url, values: [p.tests, p.wins, fmtPct(p.avgLift * 100)],
        onRowClick: () => drill.toPage(p),
      }))} />
      <DrillFooter chips={[
        { label: 'Active', count: s.tests.active },
        { label: 'Recent wins', count: s.tests.recentWins.length },
      ]} />
    </div>
  )
}
