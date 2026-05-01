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

export function TechnicalRender() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const slowestRender = [...pages].filter(p => p.renderMs).sort((a, b) => Number(b.renderMs) - Number(a.renderMs)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Render type" segments={[
        { value: s.render.ssr, tone: 'good', label: 'SSR' },
        { value: s.render.ssg, tone: 'good', label: 'SSG' },
        { value: s.render.csr, tone: 'warn', label: 'CSR' },
        { value: s.render.hybrid, tone: 'info', label: 'Hybrid' },
      ]} />
      <DistRowsBlock title="Hydration mix" rows={[
        { label: 'Hydrated cleanly', value: s.render.hydratedClean, tone: 'good' },
        { label: 'Hydration warnings', value: s.render.hydrationWarn, tone: 'warn' },
        { label: 'Hydration errors', value: s.render.hydrationErrors, tone: 'bad' },
      ]} />
      <TopListBlock title="Longest render time" items={slowestRender.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: fmtMs(Number(p.renderMs)), onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template','Pages','Avg render','Errors']} rows={s.render.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, fmtMs(t.avgRender), t.errors],
      }))} />
      <DrillFooter chips={[
        { label: 'CSR', count: s.render.csr },
        { label: 'Errors', count: s.render.hydrationErrors },
      ]} />
    </div>
  )
}
