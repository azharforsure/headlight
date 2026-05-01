import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function CompetitorsOverview() {
  const { competitors } = useSeoCrawler() as any
  const s = useCompetitorsInsights()
  if (!competitors?.length) return <EmptyState title="No competitors set" hint="Add up to 10 competitors to compare." />

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Visibility"
        scoreHint="Visibility, share-of-voice, link velocity"
        kpis={[
          { label: 'Tracked', value: competitors?.length || 0 },
          { label: 'Visibility share', value: fmtPct(s.visibilityShare * 100), tone: scoreToTone(s.visibilityShare * 100) },
          { label: 'Rank', value: `#${s.rank}`, tone: scoreToTone(100 - s.rank * 10) },
        ]} />
      <DistBlock title="Visibility share" segments={s.byCompetitor.slice(0, 6).map((c: any, i: number) => ({
        value: c.visibility, tone: c.isYou ? 'good' : (['info','warn','neutral','bad','info','neutral'][i] as any),
        label: c.isYou ? 'You' : c.domain,
      }))} />
      <DistRowsBlock title="Mover band" rows={[
        { label: 'Climbing', value: s.movers.climbing, tone: 'good' },
        { label: 'Steady', value: s.movers.steady, tone: 'info' },
        { label: 'Falling', value: s.movers.falling, tone: 'bad' },
        { label: 'New', value: s.movers.new, tone: 'info' },
      ]} />
      <TrendBlock title="Your visibility (12 weeks)" values={s.visibilitySeries} tone="info" />
      <TopListBlock title="Top competitors by visibility" items={s.byCompetitor.slice(0, 6).map((c: any) => ({
        id: c.id, primary: c.domain, secondary: c.isYou ? '(you)' : '',
        tail: fmtPct(c.visibility * 100),
      }))} />
      <SegmentBlock title="Side-by-side" headers={['Domain','Visibility','Refdoms','Top 10']} rows={s.byCompetitor.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.domain, values: [fmtPct(c.visibility * 100), compactNum(c.refDomains), c.top10],
      }))} />
      <BenchmarkBlock title="Visibility vs leader" site={s.visibilityShare * 100} benchmark={s.leaderVisibility * 100} unit="%" higherIsBetter />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Visibility', a: { v: s.visibilityShare * 100, tag: 'now' }, b: { v: s.visibilitySharePrev * 100, tag: 'prev' }, format: fmtPct },
        { label: 'Rank', a: { v: s.rank, tag: 'now' }, b: { v: s.rankPrev, tag: 'prev' }, format: v => `#${v}` },
      ]} />

      <DrillFooter chips={[
        { label: 'Gaps', count: s.gaps.total },
        { label: 'Wins', count: s.wins.total },
        { label: 'Losses', count: s.losses.total },
      ]} />
    </div>
  )
}
