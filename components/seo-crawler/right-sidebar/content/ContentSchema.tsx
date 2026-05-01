import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function ContentSchema() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const missing = pages.filter(p => !p.hasSchema && p.isHtmlPage).slice(0, 6)
  const invalid = pages.filter(p => p.schemaError).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Schema type mix" segments={s.schema.types.slice(0, 6).map((t: any, i: number) => ({
        value: t.count, tone: ['good','info','warn','neutral','bad','info'][i] as any, label: t.type,
      }))} />
      <DistRowsBlock title="Validation mix" rows={[
        { label: 'Valid', value: s.schema.valid, tone: 'good' },
        { label: 'Warning', value: s.schema.warnings, tone: 'warn' },
        { label: 'Error', value: s.schema.errors, tone: 'bad' },
      ]} />
      <TopListBlock title="Missing schema" items={missing.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url, tail: 'no schema',
        onClick: () => drill.toPage(p),
      }))} emptyText="All pages have schema" />
      <TopListBlock title="Invalid schema" items={invalid.map(p => ({
        id: p.url, primary: p.title || p.url, tail: 'error',
        onClick: () => drill.toPage(p),
      }))} emptyText="All schema valid" />
      <DrillFooter chips={[
        { label: 'Missing', count: missing.length }, { label: 'Errors', count: s.schema.errors },
      ]} />
    </div>
  )
}
