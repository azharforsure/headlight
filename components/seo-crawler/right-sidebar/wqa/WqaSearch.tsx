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

export function WqaSearch() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topPages = [...pages].sort((a, b) => Number(b.gscClicks) - Number(a.gscClicks)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Brand vs non-brand" segments={[
        { value: s.search.brandClicks, tone: 'good', label: 'Brand' },
        { value: s.search.nonBrandClicks, tone: 'info', label: 'Non-brand' },
      ]} />
      <DistRowsBlock title="Page mix" rows={[
        { label: 'High traffic (>1k clicks)', value: s.search.highTrafficPages, tone: 'good' },
        { label: 'Mid traffic', value: s.search.midTrafficPages, tone: 'info' },
        { label: 'Low traffic', value: s.search.lowTrafficPages, tone: 'neutral' },
        { label: 'Zero clicks', value: s.search.zeroClickPages, tone: 'warn' },
      ]} />
      <TrendBlock title="Clicks (90d)" values={s.search.clicksSeries} tone="good" />
      <TopListBlock title="Top pages" items={topPages.map(p => ({
        id: p.url, primary: p.title || p.url, tail: compactNum(Number(p.gscClicks)),
        onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Losers (28d)" items={s.search.losers.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: `${p.clicksDelta}`, onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By intent" headers={['Intent', 'Pages', 'Clicks', 'Pos']} rows={[
        { id: 'info', label: 'Informational', values: [s.intent.info.pages, s.intent.info.clicks, s.intent.info.pos.toFixed(1)] },
        { id: 'comm', label: 'Commercial', values: [s.intent.comm.pages, s.intent.comm.clicks, s.intent.comm.pos.toFixed(1)] },
        { id: 'tx', label: 'Transactional', values: [s.intent.tx.pages, s.intent.tx.clicks, s.intent.tx.pos.toFixed(1)] },
        { id: 'nav', label: 'Navigational', values: [s.intent.nav.pages, s.intent.nav.clicks, s.intent.nav.pos.toFixed(1)] },
      ]} />
      <BenchmarkBlock title="CTR vs industry" site={s.search.ctr * 100} benchmark={s.bench.ctr * 100} unit="%" higherIsBetter />
      <CompareBlock title="vs last 28d" rows={[
        { label: 'Clicks', a: { v: s.search.clicksTotal, tag: 'now' }, b: { v: s.search.clicksPrev, tag: 'prev' }, format: compactNum },
        { label: 'Position', a: { v: s.search.avgPosition, tag: 'now' }, b: { v: s.search.avgPositionPrev, tag: 'prev' }, format: v => v.toFixed(1) },
      ]} />
      <DrillFooter chips={[
        { label: 'Brand', count: s.search.brandClicks },
        { label: 'Striking', count: s.search.striking },
        { label: 'Losers', count: s.search.losers.length },
      ]} />
    </div>
  )
}
