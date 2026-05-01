import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function FullAuditLinks() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topLinked = [...pages].sort((a, b) => Number(b.refDomains) - Number(a.refDomains)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Link type mix" segments={[
        { value: s.links.dofollow, tone: 'good', label: 'Dofollow' },
        { value: s.links.nofollow, tone: 'info', label: 'Nofollow' },
        { value: s.links.ugc, tone: 'neutral', label: 'UGC' },
        { value: s.links.sponsored, tone: 'neutral', label: 'Sponsored' },
      ]} />
      <DistRowsBlock title="Anchor mix" rows={[
        { label: 'Branded', value: s.links.brandedAnchors, tone: 'good' },
        { label: 'Exact', value: s.links.exactAnchors, tone: 'warn' },
        { label: 'Generic', value: s.links.genericAnchors, tone: 'info' },
        { label: 'Naked', value: s.links.nakedAnchors, tone: 'neutral' },
      ]} />
      <TrendBlock title="Ref domains (90d)" values={s.links.refDomainsSeries} tone="info" />
      <TopListBlock title="Top linked pages" items={topLinked.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${p.refDomains} refdoms`, onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Lost links (30d)" items={s.links.lost.slice(0, 6).map((l: any) => ({
        id: l.url, primary: l.refDomain, secondary: l.url,
        tail: 'lost', onClick: () => drill.toPage({ url: l.url }),
      }))} emptyText="No lost links" />
      <BenchmarkBlock title="Ref domains vs competitors" site={s.links.refDomains} benchmark={s.bench.refDomains} higherIsBetter />

      <DrillFooter chips={[
        { label: 'Internal', count: s.links.internalLinks },
        { label: 'Toxic', count: s.links.toxic },
        { label: 'Anchors', count: s.links.uniqueAnchors },
      ]} />
    </div>
  )
}
