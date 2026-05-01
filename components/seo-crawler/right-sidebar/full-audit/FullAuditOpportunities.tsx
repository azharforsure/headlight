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

export function FullAuditOpportunities() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const striking = pages.filter(p => { const pos = Number(p.gscPosition); return pos > 8 && pos <= 20 && Number(p.gscImpressions) > 200 })
  const lowCtr = pages.filter(p => Number(p.gscImpressions) > 1000 && Number(p.gscClicks) / Number(p.gscImpressions) < 0.01)
  const missingMeta = pages.filter(p => !p.metaDescription || String(p.metaDescription).length < 50)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Opportunity type mix" segments={[
        { value: striking.length, tone: 'info', label: 'Striking' },
        { value: lowCtr.length, tone: 'warn', label: 'Low CTR' },
        { value: missingMeta.length, tone: 'warn', label: 'Meta gaps' },
        { value: s.search.losing, tone: 'bad', label: 'Losing' },
      ]} />
      <TrendBlock title="Clicks captured (90d)" values={s.search.clicksSeries} tone="good" />
      <TopListBlock title="Striking distance pages" items={striking.slice(0, 6).map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `#${Number(p.gscPosition).toFixed(1)}`, onClick: () => drill.toPage(p),
      }))} onSeeAll={() => drill.toCategory('search', 'Striking distance')} />
      <TopListBlock title="Low-CTR pages" items={lowCtr.slice(0, 6).map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${(Number(p.gscClicks) / Number(p.gscImpressions) * 100).toFixed(2)}%`,
        onClick: () => drill.toPage(p),
      }))} onSeeAll={() => drill.toCategory('search', 'Low CTR')} />
      <SegmentBlock title="By query intent" headers={['Intent', 'Pages', 'Clicks', 'Impr']} rows={[
        { id: 'info', label: 'Informational', values: [s.intent.info.pages, s.intent.info.clicks, s.intent.info.impressions] },
        { id: 'comm', label: 'Commercial',    values: [s.intent.comm.pages, s.intent.comm.clicks, s.intent.comm.impressions] },
        { id: 'tx',   label: 'Transactional', values: [s.intent.tx.pages,   s.intent.tx.clicks,   s.intent.tx.impressions] },
        { id: 'nav',  label: 'Navigational',  values: [s.intent.nav.pages,  s.intent.nav.clicks,  s.intent.nav.impressions] },
      ]} />
      <CompareBlock title="This crawl vs last" rows={[
        { label: 'Striking distance', a: { v: striking.length, tag: 'now' }, b: { v: s.history.strikingPrev, tag: 'prev' } },
        { label: 'Low CTR', a: { v: lowCtr.length, tag: 'now' }, b: { v: s.history.lowCtrPrev, tag: 'prev' } },
        { label: 'Avg position', a: { v: s.search.avgPosition, tag: 'now' }, b: { v: s.search.avgPositionPrev, tag: 'prev' }, format: v => v.toFixed(1) },
      ]} />

      <DrillFooter chips={[
        { label: 'Search', count: s.search.clicksTotal, onClick: () => drill.toCategory('search', 'All') },
        { label: 'Content', count: s.content.thin, onClick: () => drill.toCategory('content', 'All') },
        { label: 'Links', count: s.links.refDomains, onClick: () => drill.toCategory('links', 'All') },
      ]} />
    </div>
  )
}
