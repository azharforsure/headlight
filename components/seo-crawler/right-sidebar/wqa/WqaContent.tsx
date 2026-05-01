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

export function WqaContent() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const treeNodes = s.content.clusters.slice(0, 8).map((c: any, i: number) => ({
    id: c.id, label: c.label, value: c.pages, tone: i % 2 ? 'info' : 'neutral',
  }))

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Cluster mix" segments={s.content.clusters.slice(0, 5).map((c: any, i: number) => ({
        value: c.pages, tone: ['good', 'info', 'warn', 'neutral', 'bad'][i] as any, label: c.label,
      }))} />
      <DistRowsBlock title="Length mix" rows={[
        { label: '<300 words', value: s.content.lengthMix.tiny, tone: 'bad' },
        { label: '300–800', value: s.content.lengthMix.short, tone: 'warn' },
        { label: '800–2000', value: s.content.lengthMix.medium, tone: 'good' },
        { label: '>2000', value: s.content.lengthMix.long, tone: 'good' },
      ]} />
      <TopListBlock title="Top clusters" items={s.content.clusters.slice(0, 6).map((c: any) => ({
        id: c.id, primary: c.label, tail: `${c.pages} pages`,
        onClick: () => drill.toCategory('content', c.label),
      }))} />
      <TopListBlock title="Thin pages" items={s.content.thinPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: `${p.wordCount}w`,
        onClick: () => drill.toPage(p),
      }))} />
      <TreemapBlock title="Cluster share" nodes={treeNodes as any} />
      <DrillFooter chips={[
        { label: 'Clusters', count: s.content.clusterCount },
        { label: 'Thin', count: s.thin },
        { label: 'Dup', count: s.dup },
      ]} />
    </div>
  )
}
