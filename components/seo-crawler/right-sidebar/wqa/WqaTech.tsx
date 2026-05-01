import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function WqaTech() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worst = [...pages].filter(p => p.lcpMs).sort((a, b) => Number(b.lcpMs) - Number(a.lcpMs)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Status" segments={[
        { value: s.status.ok, tone: 'good', label: '2xx' },
        { value: s.status.redirect, tone: 'info', label: '3xx' },
        { value: s.status.client, tone: 'bad', label: '4xx' },
        { value: s.status.server, tone: 'bad', label: '5xx' },
      ]} />
      <DistRowsBlock title="Perf bands" rows={[
        { label: 'LCP good (<2.5s)', value: s.perf.lcpGood, tone: 'good' },
        { label: 'LCP needs improvement', value: s.perf.lcpMid, tone: 'warn' },
        { label: 'LCP poor (>4s)', value: s.perf.lcpPoor, tone: 'bad' },
      ]} />
      <TopListBlock title="Worst LCP" items={worst.map(p => ({
        id: p.url, primary: p.title || p.url, tail: fmtMs(Number(p.lcpMs)), onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template', 'Pages', 'CWV pass', 'Indexable']} rows={s.tech.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, fmtPct(t.cwvPass), fmtPct(t.indexable)],
      }))} />
      <DrillFooter chips={[
        { label: 'Errors', count: s.status.client + s.status.server },
        { label: 'Slow LCP', count: s.perf.lcpPoor },
      ]} />
    </div>
  )
}
