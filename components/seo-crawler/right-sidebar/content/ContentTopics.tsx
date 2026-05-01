import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar, TreemapBlock,
  CompareBlock, KvBlock, TimelineList, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function ContentTopics() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const treeNodes = s.clusters.slice(0, 10).map((c: any, i: number) => ({
    id: c.id, label: c.label, value: c.pages, tone: i % 3 === 0 ? 'good' : i % 3 === 1 ? 'info' : 'neutral',
  }))
  const orphans = s.clusters.filter((c: any) => c.pages === 1).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Top cluster mix" segments={s.clusters.slice(0, 6).map((c: any, i: number) => ({
        value: c.pages, tone: ['good','info','warn','neutral','bad','info'][i] as any, label: c.label,
      }))} />
      <DistRowsBlock title="Cluster freshness" rows={[
        { label: 'Updated <30d', value: s.cluster.fresh, tone: 'good' },
        { label: '30–180d', value: s.cluster.recent, tone: 'info' },
        { label: '180–365d', value: s.cluster.aging, tone: 'warn' },
        { label: '>1y', value: s.cluster.stale, tone: 'bad' },
      ]} />
      <TopListBlock title="Biggest clusters" items={s.clusters.slice(0, 6).map((c: any) => ({
        id: c.id, primary: c.label, tail: `${c.pages} pages`,
        onClick: () => drill.toCategory('content', c.label),
      }))} />
      <TopListBlock title="Orphan clusters" items={orphans.map((c: any) => ({
        id: c.id, primary: c.label, tail: '1 page', onClick: () => drill.toCategory('content', c.label),
      }))} emptyText="No orphan clusters" />
      <TreemapBlock title="Cluster share" nodes={treeNodes as any} onClick={n => drill.toCategory('content', n.label)} />
      <DrillFooter chips={[
        { label: 'Clusters', count: s.clusters.length },
        { label: 'Orphans', count: orphans.length },
      ]} />
    </div>
  )
}
