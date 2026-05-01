import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineList, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function ContentOverview() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const lowest = [...pages].sort((a, b) => Number(a.qualityScore) - Number(b.qualityScore)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Content"
        kpis={[
          { label: 'Pages', value: compactNum(s.total) },
          { label: 'Clusters', value: s.clusters.length },
          { label: 'Avg quality', value: s.avgQuality.toFixed(0), tone: scoreToTone(s.avgQuality) },
        ]} />
      <DistBlock title="Quality bands" segments={[
        { value: s.bands.excellent, tone: 'good', label: 'Excellent' },
        { value: s.bands.good, tone: 'good', label: 'Good' },
        { value: s.bands.fair, tone: 'info', label: 'Fair' },
        { value: s.bands.poor, tone: 'warn', label: 'Poor' },
        { value: s.bands.critical, tone: 'bad', label: 'Critical' },
      ]} />
      <DistRowsBlock title="Length mix" rows={[
        { label: '<300 words', value: s.lengthMix.tiny, tone: 'bad' },
        { label: '300–800', value: s.lengthMix.short, tone: 'warn' },
        { label: '800–2000', value: s.lengthMix.medium, tone: 'good' },
        { label: '>2000', value: s.lengthMix.long, tone: 'good' },
      ]} />
      <TrendBlock title="Avg quality (12 weeks)" values={s.qualitySeries} tone="info" />
      <TopListBlock title="Lowest quality pages" items={lowest.map(p => ({
        id: p.url, primary: p.title || p.url, tail: Number(p.qualityScore).toFixed(0),
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By cluster" headers={['Cluster','Pages','Thin','Avg q']} rows={s.clusters.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [c.pages, c.thin, c.avgQuality.toFixed(0)],
      }))} />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'Avg quality', a: { v: s.avgQuality, tag: 'now' }, b: { v: s.avgQualityPrev, tag: 'prev' }, format: v => v.toFixed(0) },
        { label: 'Thin', a: { v: s.thin, tag: 'now' }, b: { v: s.thinPrev, tag: 'prev' } },
      ]} />

      <DrillFooter chips={[
        { label: 'Topics', count: s.clusters.length },
        { label: 'Thin', count: s.thin },
        { label: 'Dup', count: s.dup.exact + s.dup.near },
      ]} />
    </div>
  )
}
