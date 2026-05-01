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

export function FullAuditIssues() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()
  const heatCells = useMemo(() => {
    if (!pages?.length) return { cells: [], xLabels: [], yLabels: [] }
    const tpls = [...new Set(pages.map(templateOf))].slice(0, 6)
    const sevs = ['errors', 'warnings', 'notices'] as const
    const cells: Array<{ x: string; y: string; value: number }> = []
    for (const t of tpls) for (const sev of sevs) {
      const n = pages.filter(p => templateOf(p) === t && (
        sev === 'errors' ? Number(p.statusCode) >= 400 :
        sev === 'warnings' ? p.indexable === false :
        Number(p.wordCount) < 300
      )).length
      cells.push({ y: t, x: sev, value: n })
    }
    return { cells, xLabels: [...sevs], yLabels: tpls }
  }, [pages])

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const top4xx = pages.filter(p => Number(p.statusCode) >= 400 && Number(p.statusCode) < 500).slice(0, 6)
  const top5xx = pages.filter(p => Number(p.statusCode) >= 500).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Severity stack" segments={[
        { value: s.issues.errors, tone: 'bad', label: 'Errors' },
        { value: s.issues.warnings, tone: 'warn', label: 'Warnings' },
        { value: s.issues.notices, tone: 'info', label: 'Notices' },
      ]} />
      <DistRowsBlock title="Issue category mix" rows={[
        { label: '4xx broken links', value: s.issues.errors4xx, tone: 'bad' },
        { label: '5xx server errors', value: s.issues.errors5xx, tone: 'bad' },
        { label: 'Noindex pages', value: s.tech.noindex, tone: 'warn' },
        { label: 'Redirect chains', value: s.tech.redirectChains, tone: 'warn' },
        { label: 'Mixed content', value: s.tech.mixedContent, tone: 'warn' },
      ]} />
      <TopListBlock title="Top 4xx pages" items={top4xx.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${p.statusCode}`, onClick: () => drill.toPage(p),
      }))} onSeeAll={() => drill.toCategory('status', '4xx Errors')} />
      <TopListBlock title="Top 5xx pages" items={top5xx.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${p.statusCode}`, onClick: () => drill.toPage(p),
      }))} emptyText="No 5xx errors" onSeeAll={() => drill.toCategory('status', '5xx Errors')} />
      <SegmentBlock title="By status code" headers={['Code', 'Pages', 'Indexable', 'Has clicks']} rows={[
        { id: '2xx', label: '2xx', values: [s.status.ok, s.tech.indexable, s.search.clicksTotal] },
        { id: '3xx', label: '3xx', values: [s.status.redirect, 0, 0] },
        { id: '4xx', label: '4xx', values: [s.status.client, 0, 0] },
        { id: '5xx', label: '5xx', values: [s.status.server, 0, 0] },
      ]} />
      <HeatmapBlock title="Template × severity" cells={heatCells.cells} xLabels={heatCells.xLabels} yLabels={heatCells.yLabels} />

      <DrillFooter chips={[
        { label: '4xx', count: s.status.client, onClick: () => drill.toCategory('status', '4xx') },
        { label: '5xx', count: s.status.server, onClick: () => drill.toCategory('status', '5xx') },
        { label: 'Noindex', count: s.tech.noindex, onClick: () => drill.toCategory('indexability', 'Noindex') },
      ]} />
    </div>
  )
}
