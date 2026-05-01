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

export function LinksAnchors() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Anchor type mix" segments={[
        { value: s.anchors.branded, tone: 'good', label: 'Branded' },
        { value: s.anchors.exact, tone: 'warn', label: 'Exact' },
        { value: s.anchors.partial, tone: 'info', label: 'Partial' },
        { value: s.anchors.generic, tone: 'info', label: 'Generic' },
        { value: s.anchors.naked, tone: 'neutral', label: 'Naked' },
        { value: s.anchors.image, tone: 'neutral', label: 'Image' },
      ]} />
      <DistRowsBlock title="Anchor lengths" rows={[
        { label: '1 word', value: s.anchors.len1, tone: 'warn' },
        { label: '2–3 words', value: s.anchors.len23, tone: 'good' },
        { label: '4–6 words', value: s.anchors.len46, tone: 'good' },
        { label: '7+ words', value: s.anchors.len7, tone: 'info' },
      ]} />
      <TopListBlock title="Top anchors" items={s.anchors.top.slice(0, 8).map((a: any) => ({
        id: a.text, primary: a.text || '(empty)', tail: `${a.count} · ${a.type}`,
      }))} />
      <TopListBlock title="Over-optimized exact anchors" items={s.anchors.exactRisk.slice(0, 6).map((a: any) => ({
        id: a.text, primary: a.text, tail: `${a.count}`,
      }))} emptyText="No exact-match risk" />
      <SegmentBlock title="By target page" headers={['Page','Branded','Exact','Generic']} rows={s.anchors.byPage.slice(0, 6).map((p: any) => ({
        id: p.url, label: p.title || p.url, values: [p.branded, p.exact, p.generic], onRowClick: () => drill.toPage(p),
      }))} />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'Branded share', a: { v: s.anchors.brandedShare * 100, tag: 'now' }, b: { v: s.anchors.brandedSharePrev * 100, tag: 'prev' }, format: fmtPct },
        { label: 'Exact share', a: { v: s.anchors.exactShare * 100, tag: 'now' }, b: { v: s.anchors.exactSharePrev * 100, tag: 'prev' }, format: fmtPct },
      ]} />
      <DrillFooter chips={[
        { label: 'Exact risk', count: s.anchors.exactRisk.length },
        { label: 'Empty anchors', count: s.anchors.empty },
      ]} />
    </div>
  )
}
