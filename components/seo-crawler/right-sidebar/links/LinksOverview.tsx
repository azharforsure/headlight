import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket } from '../_shared/derive'

export function LinksOverview() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topLinked = [...pages].sort((a, b) => Number(b.refDomains) - Number(a.refDomains)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Authority"
        scoreHint="Internal + external + anchors + toxic"
        kpis={[
          { label: 'Ref domains', value: compactNum(s.refDomains) },
          { label: 'Backlinks', value: compactNum(s.totalBacklinks) },
          { label: 'Avg DR', value: s.avgDr.toFixed(0), tone: scoreToTone(s.avgDr) },
        ]}
        trendCurrent={s.refDomains} trendPrevious={s.refDomainsPrev} />
      <DistBlock title="Link type mix" segments={[
        { value: s.dofollow, tone: 'good', label: 'Dofollow' },
        { value: s.nofollow, tone: 'info', label: 'Nofollow' },
        { value: s.ugc, tone: 'neutral', label: 'UGC' },
        { value: s.sponsored, tone: 'neutral', label: 'Sponsored' },
      ]} />
      <DistRowsBlock title="Internal link health" rows={[
        { label: 'Avg internal links', value: s.internal.avgPerPage.toFixed(0) },
        { label: 'Pages with 0 inlinks', value: s.internal.orphans, tone: 'warn' },
        { label: 'Broken internal', value: s.internal.broken, tone: 'bad' },
        { label: 'Redirect internal', value: s.internal.redirected, tone: 'warn' },
      ]} />
      <TrendBlock title="Ref domains (90d)" values={s.refDomainsSeries} tone="info" />
      <TopListBlock title="Top linked pages" items={topLinked.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${p.refDomains} refdoms`, onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template','Pages','Inlinks','Outlinks']} rows={s.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, t.inlinks, t.outlinks],
      }))} />
      <BenchmarkBlock title="Ref domains vs competitors" site={s.refDomains} benchmark={s.bench.refDomains} higherIsBetter />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'Ref domains', a: { v: s.refDomains, tag: 'now' }, b: { v: s.refDomainsPrev, tag: 'prev' } },
        { label: 'Backlinks', a: { v: s.totalBacklinks, tag: 'now' }, b: { v: s.totalBacklinksPrev, tag: 'prev' }, format: compactNum },
        { label: 'Avg DR', a: { v: s.avgDr, tag: 'now' }, b: { v: s.avgDrPrev, tag: 'prev' }, format: v => v.toFixed(0) },
      ]} />

      <DrillFooter chips={[
        { label: 'Internal', count: s.internal.total },
        { label: 'External', count: s.external.total },
        { label: 'Anchors', count: s.uniqueAnchors },
        { label: 'Toxic', count: s.toxicCount },
      ]} />
    </div>
  )
}
