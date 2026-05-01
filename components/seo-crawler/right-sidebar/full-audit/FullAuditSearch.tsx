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

export function FullAuditSearch() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()
  const urlBuckets = useMemo(() => {
    if (!pages?.length) return []
    const m = new Map<string, { clicks: number; impr: number; pos: number; n: number }>()
    for (const p of pages) {
      const seg = (p.url || '').split('/').slice(0, 4).join('/') || '/'
      const cur = m.get(seg) || { clicks: 0, impr: 0, pos: 0, n: 0 }
      cur.clicks += Number(p.gscClicks) || 0
      cur.impr += Number(p.gscImpressions) || 0
      cur.pos += Number(p.gscPosition) || 0
      cur.n += 1
      m.set(seg, cur)
    }
    return [...m.entries()].sort((a, b) => b[1].clicks - a[1].clicks).slice(0, 6)
      .map(([id, v]) => ({ id, label: id, values: [v.clicks, v.impr, (v.pos / Math.max(1, v.n)).toFixed(1)] }))
  }, [pages])

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topClicks = [...pages].sort((a, b) => Number(b.gscClicks) - Number(a.gscClicks)).slice(0, 6)
  const winners = s.search.winners.slice(0, 6)
  const losers  = s.search.losers.slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Brand vs non-brand" segments={[
        { value: s.search.brandClicks, tone: 'good', label: 'Brand' },
        { value: s.search.nonBrandClicks, tone: 'info', label: 'Non-brand' },
      ]} />
      <DistRowsBlock title="Device mix" rows={[
        { label: 'Mobile',  value: s.search.mobileClicks,  tone: 'info' },
        { label: 'Desktop', value: s.search.desktopClicks, tone: 'info' },
        { label: 'Tablet',  value: s.search.tabletClicks,  tone: 'neutral' },
      ]} />
      <TrendBlock title="Clicks (90d)" values={s.search.clicksSeries} tone="good" />
      <TopListBlock title="Top queries" items={s.search.topQueries.slice(0, 6).map((q: any) => ({
        id: q.query, primary: q.query, tail: compactNum(q.clicks),
        onClick: () => drill.toCategory('search', q.query),
      }))} />
      <TopListBlock title="Winners (28d)" items={winners.map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: `+${p.clicksDelta}`,
        onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Losers (28d)" items={losers.map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: `${p.clicksDelta}`,
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By URL bucket" headers={['Path', 'Clicks', 'Impr', 'Pos']} rows={urlBuckets} />
      <BenchmarkBlock title="CTR vs industry" site={s.search.ctr * 100} benchmark={s.bench.ctr * 100} unit="%" higherIsBetter />
      <CompareBlock title="vs last 28d" rows={[
        { label: 'Clicks',     a: { v: s.search.clicksTotal,  tag: 'now' }, b: { v: s.search.clicksPrev,  tag: 'prev' }, format: compactNum },
        { label: 'Impressions', a: { v: s.search.imprTotal,    tag: 'now' }, b: { v: s.search.imprPrev,    tag: 'prev' }, format: compactNum },
        { label: 'Avg position', a: { v: s.search.avgPosition, tag: 'now' }, b: { v: s.search.avgPositionPrev, tag: 'prev' }, format: v => v.toFixed(1) },
      ]} />

      <DrillFooter chips={[
        { label: 'Brand', count: s.search.brandClicks },
        { label: 'Non-brand', count: s.search.nonBrandClicks },
        { label: 'Striking', count: s.oppRanks.striking },
      ]} />
    </div>
  )
}
