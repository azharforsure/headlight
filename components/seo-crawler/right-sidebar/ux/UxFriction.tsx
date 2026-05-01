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

export function UxFriction() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worst = [...pages].filter(p => p.frictionScore != null).sort((a, b) => Number(b.frictionScore) - Number(a.frictionScore)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Friction signal mix" segments={[
        { value: s.friction.rageClicks, tone: 'bad', label: 'Rage clicks' },
        { value: s.friction.deadClicks, tone: 'warn', label: 'Dead clicks' },
        { value: s.friction.errorClicks, tone: 'bad', label: 'Errors' },
        { value: s.friction.formAbandon, tone: 'warn', label: 'Form abandon' },
        { value: s.friction.scrollDepth, tone: 'info', label: 'Low scroll' },
      ]} />
      <DistRowsBlock title="Where friction happens" rows={[
        { label: 'Above the fold', value: s.friction.aboveFold, tone: 'bad' },
        { label: 'Form fields', value: s.friction.formFields, tone: 'warn' },
        { label: 'CTA buttons', value: s.friction.cta, tone: 'warn' },
        { label: 'Navigation', value: s.friction.nav, tone: 'info' },
      ]} />
      <TopListBlock title="Highest friction pages" items={worst.map(p => ({
        id: p.url, primary: p.title || p.url, tail: Number(p.frictionScore).toFixed(0),
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template','Pages','Friction','CVR']} rows={s.friction.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, t.avgFriction.toFixed(0), fmtPct(t.cvr * 100)],
      }))} />
      <DrillFooter chips={[
        { label: 'Rage', count: s.friction.rageClicks },
        { label: 'Dead', count: s.friction.deadClicks },
        { label: 'Errors', count: s.friction.errorClicks },
      ]} />
    </div>
  )
}
