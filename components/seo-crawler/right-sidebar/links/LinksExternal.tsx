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

export function LinksExternal() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topRefdoms = s.external.topRefDomains.slice(0, 6)
  const recentlyLost = s.external.lost.slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="DR mix" segments={[
        { value: s.external.dr80plus, tone: 'good', label: '80+' },
        { value: s.external.dr5079, tone: 'good', label: '50–79' },
        { value: s.external.dr2049, tone: 'info', label: '20–49' },
        { value: s.external.dr019, tone: 'neutral', label: '0–19' },
      ]} />
      <DistRowsBlock title="TLD mix" rows={s.external.tldMix.slice(0, 6).map((t: any) => ({
        label: t.tld, value: t.count, tone: t.tld === '.edu' || t.tld === '.gov' ? 'good' : 'info',
      }))} />
      <TrendBlock title="Ref domains (90d)" values={s.refDomainsSeries} tone="info" />
      <TopListBlock title="Top referring domains" items={topRefdoms.map((r: any) => ({
        id: r.domain, primary: r.domain, tail: `DR ${r.dr} · ${r.backlinks}`,
      }))} />
      <TopListBlock title="Recently lost" items={recentlyLost.map((l: any) => ({
        id: l.domain, primary: l.domain, tail: l.relTime,
      }))} emptyText="No recent losses" />
      <SegmentBlock title="By target page" headers={['Page','Refdoms','New','Lost']} rows={s.external.byPage.slice(0, 6).map((p: any) => ({
        id: p.url, label: p.title || p.url, values: [p.refDomains, p.gained30d, p.lost30d], onRowClick: () => drill.toPage(p),
      }))} />
      <BenchmarkBlock title="vs competitor avg" site={s.external.refDomains} benchmark={s.bench.refDomains} higherIsBetter />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'Ref domains', a: { v: s.external.refDomains, tag: 'now' }, b: { v: s.external.refDomainsPrev, tag: 'prev' } },
        { label: 'Avg DR', a: { v: s.avgDr, tag: 'now' }, b: { v: s.avgDrPrev, tag: 'prev' }, format: v => v.toFixed(0) },
      ]} />
      <DrillFooter chips={[
        { label: 'New', count: s.external.gained30d },
        { label: 'Lost', count: s.external.lost30d },
        { label: 'Toxic', count: s.toxicCount },
      ]} />
    </div>
  )
}
