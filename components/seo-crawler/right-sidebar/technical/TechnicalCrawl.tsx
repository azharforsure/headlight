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

export function TechnicalCrawl() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const slowestRedirects = pages.filter(p => Number(p.redirectChainLength) > 1)
    .sort((a, b) => Number(b.redirectChainLength) - Number(a.redirectChainLength)).slice(0, 6)
  const deepest = [...pages].sort((a, b) => Number(b.crawlDepth) - Number(a.crawlDepth)).slice(0, 6)
  const heatCells = useMemo(() => {
    const depths = ['0-1','2-3','4-5','6+']
    const codes = ['2xx','3xx','4xx','5xx']
    const cells: Array<{ x: string; y: string; value: number }> = []
    for (const d of depths) for (const c of codes) {
      const n = pages.filter(p => depthBucket(Number(p.crawlDepth)) === d && (
        c === '2xx' ? Number(p.statusCode) < 300 :
        c === '3xx' ? Number(p.statusCode) >= 300 && Number(p.statusCode) < 400 :
        c === '4xx' ? Number(p.statusCode) >= 400 && Number(p.statusCode) < 500 :
        Number(p.statusCode) >= 500
      )).length
      cells.push({ y: d, x: c, value: n })
    }
    return { cells, xLabels: codes, yLabels: depths }
  }, [pages])

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Status mix" segments={[
        { value: s.status.ok, tone: 'good', label: '2xx' },
        { value: s.status.redirect, tone: 'info', label: '3xx' },
        { value: s.status.client, tone: 'bad', label: '4xx' },
        { value: s.status.server, tone: 'bad', label: '5xx' },
        { value: s.status.blocked, tone: 'warn', label: 'blocked' },
      ]} />
      <DistRowsBlock title="Depth distribution" rows={[
        { label: '0–1', value: pages.filter(p => Number(p.crawlDepth) <= 1).length },
        { label: '2–3', value: pages.filter(p => { const d = Number(p.crawlDepth); return d >= 2 && d <= 3 }).length },
        { label: '4–5', value: pages.filter(p => { const d = Number(p.crawlDepth); return d >= 4 && d <= 5 }).length },
        { label: '6+',  value: pages.filter(p => Number(p.crawlDepth) >= 6).length, tone: 'warn' },
      ]} />
      <TopListBlock title="Redirect chains" items={slowestRedirects.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${p.redirectChainLength} hops`, onClick: () => drill.toPage(p),
      }))} onSeeAll={() => drill.toCategory('links', 'Redirect Chains')} />
      <TopListBlock title="Deepest pages" items={deepest.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `depth ${p.crawlDepth}`, onClick: () => drill.toPage(p),
      }))} />
      <HeatmapBlock title="Depth × status" cells={heatCells.cells} xLabels={heatCells.xLabels} yLabels={heatCells.yLabels} />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'Discovered', a: { v: s.total, tag: 'now' }, b: { v: s.totalPrev, tag: 'prev' } },
        { label: 'Blocked', a: { v: s.status.blocked, tag: 'now' }, b: { v: s.status.blockedPrev, tag: 'prev' } },
        { label: 'Avg depth', a: { v: s.crawl.avgDepth, tag: 'now' }, b: { v: s.crawl.avgDepthPrev, tag: 'prev' }, format: v => v.toFixed(1) },
      ]} />
      <DrillFooter chips={[
        { label: 'Indexing', count: s.indexability.noindex + s.indexability.blocked },
        { label: 'Render' }, { label: 'Sitemap' },
      ]} />
    </div>
  )
}
