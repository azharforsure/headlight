import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket } from '../_shared/derive'

export function UxOverview() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worst = [...pages].filter(p => p.frictionScore != null).sort((a, b) => Number(b.frictionScore) - Number(a.frictionScore)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="UX"
        kpis={[
          { label: 'Conv. rate', value: fmtPct(s.cvr * 100), tone: scoreToTone(s.cvr * 100) },
          { label: 'Bounce', value: fmtPct(s.bounceRate * 100), tone: s.bounceRate > 0.6 ? 'warn' : 'good' },
          { label: 'Avg session', value: `${s.avgSessionSec}s` },
        ]}
        trendCurrent={s.cvr * 100} trendPrevious={s.cvrPrev * 100} trendUnit="%" />
      <DistBlock title="Friction band mix" segments={[
        { value: s.frictionBands.low, tone: 'good', label: 'Low' },
        { value: s.frictionBands.medium, tone: 'warn', label: 'Medium' },
        { value: s.frictionBands.high, tone: 'bad', label: 'High' },
      ]} />
      <DistRowsBlock title="Conversion event mix" rows={[
        { label: 'Form submit', value: s.events.form, tone: 'good' },
        { label: 'Add to cart', value: s.events.atc, tone: 'good' },
        { label: 'Checkout', value: s.events.checkout, tone: 'good' },
        { label: 'Signup', value: s.events.signup, tone: 'good' },
      ]} />
      <TrendBlock title="Conversion rate (30d)" values={s.cvrSeries} tone="info" />
      <TopListBlock title="Highest friction pages" items={worst.map(p => ({
        id: p.url, primary: p.title || p.url, tail: Number(p.frictionScore).toFixed(0),
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template','Pages','CVR','Bounce']} rows={s.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, fmtPct(t.cvr * 100), fmtPct(t.bounce * 100)],
      }))} />
      <FunnelBlock title="Site-wide funnel" steps={s.funnel.slice(0, 6)} />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Conv. rate', a: { v: s.cvr * 100, tag: 'now' }, b: { v: s.cvrPrev * 100, tag: 'prev' }, format: fmtPct },
        { label: 'Bounce', a: { v: s.bounceRate * 100, tag: 'now' }, b: { v: s.bounceRatePrev * 100, tag: 'prev' }, format: fmtPct },
      ]} />
      <DrillFooter chips={[
        { label: 'Friction', count: s.frictionBands.high },
        { label: 'Funnel drops', count: s.funnelDrops },
        { label: 'Forms', count: s.forms.total },
      ]} />
    </div>
  )
}
