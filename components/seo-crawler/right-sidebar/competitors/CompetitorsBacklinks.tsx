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

export function CompetitorsBacklinks() {
  const { competitors } = useSeoCrawler() as any
  const s = useCompetitorsInsights()
  if (!competitors?.length) return <EmptyState title="No competitors set" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Refdom share" segments={s.backlinks.byCompetitor.slice(0, 6).map((c: any, i: number) => ({
        value: c.refDomains, tone: c.isYou ? 'good' : (['info','warn','neutral','bad','info','neutral'][i] as any),
        label: c.isYou ? 'You' : c.domain,
      }))} />
      <TrendBlock title="Your refdoms (90d)" values={s.backlinks.youSeries} tone="info" />
      <TopListBlock title="Refdoms competitors have, you don't" items={s.backlinks.gapList.slice(0, 6).map((r: any) => ({
        id: r.domain, primary: r.domain, secondary: `DR ${r.dr}`, tail: r.competitors.join(', '),
      }))} emptyText="No backlink gaps" />
      <TopListBlock title="Refdoms unique to you" items={s.backlinks.youOnly.slice(0, 6).map((r: any) => ({
        id: r.domain, primary: r.domain, tail: `DR ${r.dr}`,
      }))} />
      <SegmentBlock title="By competitor" headers={['Domain','Refdoms','New 30d','DR avg']} rows={s.backlinks.byCompetitor.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.domain, values: [compactNum(c.refDomains), c.gained30d, c.avgDr.toFixed(0)],
      }))} />
      <BenchmarkBlock title="Refdoms vs leader" site={s.backlinks.you.refDomains} benchmark={s.backlinks.leader.refDomains} higherIsBetter />
      <DrillFooter chips={[
        { label: 'Gaps', count: s.backlinks.gapTotal },
        { label: 'You only', count: s.backlinks.youOnly.length },
      ]} />
    </div>
  )
}
