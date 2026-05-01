import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket } from '../_shared/derive'

export function LinksInternal() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const orphans = pages.filter(p => Number(p.inlinks) === 0).slice(0, 6)
  const overlinked = [...pages].sort((a, b) => Number(b.inlinks) - Number(a.inlinks)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistRowsBlock title="Inlinks per page" rows={[
        { label: '0', value: s.internal.bucket0, tone: 'bad' },
        { label: '1–2', value: s.internal.bucket12, tone: 'warn' },
        { label: '3–10', value: s.internal.bucket310, tone: 'info' },
        { label: '11–50', value: s.internal.bucket1150, tone: 'good' },
        { label: '50+', value: s.internal.bucket50, tone: 'good' },
      ]} />
      <DistBlock title="Anchor type" segments={[
        { value: s.internal.anchorBranded, tone: 'good', label: 'Branded' },
        { value: s.internal.anchorExact, tone: 'warn', label: 'Exact' },
        { value: s.internal.anchorGeneric, tone: 'info', label: 'Generic' },
        { value: s.internal.anchorNaked, tone: 'neutral', label: 'Naked' },
      ]} />
      <TopListBlock title="Orphan pages" items={orphans.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url, tail: '0 inlinks',
        onClick: () => drill.toPage(p),
      }))} onSeeAll={() => drill.toCategory('links', 'Orphans')} />
      <TopListBlock title="Most-linked pages" items={overlinked.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${p.inlinks} inlinks`, onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template','Pages','Avg inlinks','Orphans']} rows={s.internal.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, t.avgInlinks.toFixed(0), t.orphans],
      }))} />
      <DrillFooter chips={[
        { label: 'Orphans', count: s.internal.orphans },
        { label: 'Broken', count: s.internal.broken },
        { label: 'Redirected', count: s.internal.redirected },
      ]} />
    </div>
  )
}
