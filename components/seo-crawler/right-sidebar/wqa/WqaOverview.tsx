import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function WqaOverview() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()
  const tplRows = useMemo(() => {
    if (!pages?.length) return []
    const m = new Map<string, { total: number; thin: number; dup: number }>()
    for (const p of pages) {
      const t = templateOf(p)
      const cur = m.get(t) || { total: 0, thin: 0, dup: 0 }
      cur.total++
      if (Number(p.wordCount) < 300) cur.thin++
      if (p.exactDuplicate || p.nearDuplicateMatch) cur.dup++
      m.set(t, cur)
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6)
      .map(([id, v]) => ({ id, label: id, values: [v.total, v.thin, v.dup] }))
  }, [pages])

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const lowest = [...pages].sort((a, b) => Number(a.qualityScore) - Number(b.qualityScore)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Quality"
        kpis={[
          { label: 'Pages', value: compactNum(s.total) },
          { label: 'Avg quality', value: s.avgQuality.toFixed(0), tone: scoreToTone(s.avgQuality) },
          { label: 'Thin', value: s.thin, tone: s.thin ? 'warn' : 'neutral' },
        ]} />
      <DistBlock title="Status mix" segments={[
        { value: s.status.ok, tone: 'good', label: '2xx' },
        { value: s.status.redirect, tone: 'info', label: '3xx' },
        { value: s.status.client, tone: 'bad', label: '4xx' },
        { value: s.status.server, tone: 'bad', label: '5xx' },
      ]} />
      <DistRowsBlock title="Quality bands" rows={[
        { label: 'Excellent (90+)', value: s.bands.excellent, tone: 'good' },
        { label: 'Good (75–89)', value: s.bands.good, tone: 'good' },
        { label: 'Fair (60–74)', value: s.bands.fair, tone: 'info' },
        { label: 'Poor (40–59)', value: s.bands.poor, tone: 'warn' },
        { label: 'Critical (<40)', value: s.bands.critical, tone: 'bad' },
      ]} />
      <TrendBlock title="Avg quality (12 weeks)" values={s.qualitySeries} tone="info" />
      <TopListBlock title="Lowest quality pages" items={lowest.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: Number(p.qualityScore).toFixed(0), onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template', 'Total', 'Thin', 'Dup']} rows={tplRows} />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'Avg quality', a: { v: s.avgQuality, tag: 'now' }, b: { v: s.avgQualityPrev, tag: 'prev' }, format: v => v.toFixed(0) },
        { label: 'Thin', a: { v: s.thin, tag: 'now' }, b: { v: s.thinPrev, tag: 'prev' } },
        { label: 'Critical', a: { v: s.bands.critical, tag: 'now' }, b: { v: s.bands.criticalPrev, tag: 'prev' } },
      ]} />

      <DrillFooter chips={[
        { label: 'Quality', count: s.thin + s.dup },
        { label: 'Search', count: s.search.clicksTotal },
        { label: 'Tech', count: s.status.client + s.status.server },
      ]} />
    </div>
  )
}
