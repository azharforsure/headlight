import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineList, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function TechnicalIndexing() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const notInSitemap = pages.filter(p => p.inSitemap === false && p.statusCode === 200 && p.isHtmlPage)
  const inSitemapBlocked = pages.filter(p => p.inSitemap === true && (!p.indexable || Number(p.statusCode) >= 400))

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Indexability mix" segments={[
        { value: s.indexability.indexable, tone: 'good', label: 'Indexable' },
        { value: s.indexability.noindex, tone: 'warn', label: 'Noindex' },
        { value: s.indexability.canonicalized, tone: 'info', label: 'Canonical to other' },
        { value: s.indexability.blocked, tone: 'bad', label: 'Blocked' },
      ]} />
      <DonutBlock title="Sitemap parity" segments={[
        { value: pages.filter(p => p.inSitemap).length, tone: 'good', label: 'In sitemap' },
        { value: notInSitemap.length, tone: 'warn', label: 'Missing' },
      ]} />
      <TopListBlock title="Indexable but not in sitemap" items={notInSitemap.slice(0, 6).map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url, tail: 'missing',
        onClick: () => drill.toPage(p),
      }))} onSeeAll={() => drill.toCategory('indexability', 'Missing from sitemap')} />
      <TopListBlock title="In sitemap but not indexable" items={inSitemapBlocked.slice(0, 6).map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: !p.indexable ? 'noindex' : `${p.statusCode}`, onClick: () => drill.toPage(p),
      }))} emptyText="All sitemap entries indexable" />
      <SegmentBlock title="By template" headers={['Template','Pages','Indexable','Noindex']} rows={s.indexability.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, t.indexable, t.noindex],
      }))} />
      <DrillFooter chips={[
        { label: 'Noindex', count: s.indexability.noindex },
        { label: 'Canonical', count: s.indexability.canonMismatch },
        { label: 'Sitemap', count: notInSitemap.length },
      ]} />
    </div>
  )
}
