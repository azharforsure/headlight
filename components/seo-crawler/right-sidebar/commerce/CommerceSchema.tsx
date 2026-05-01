import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function CommerceSchema() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistRowsBlock title="Schema field coverage" rows={[
        { label: 'Price', value: fmtPct(s.schema.fields.price * 100), tone: scoreToTone(s.schema.fields.price * 100) },
        { label: 'Availability', value: fmtPct(s.schema.fields.availability * 100), tone: scoreToTone(s.schema.fields.availability * 100) },
        { label: 'Rating', value: fmtPct(s.schema.fields.rating * 100), tone: scoreToTone(s.schema.fields.rating * 100) },
        { label: 'Brand', value: fmtPct(s.schema.fields.brand * 100), tone: scoreToTone(s.schema.fields.brand * 100) },
        { label: 'GTIN/SKU', value: fmtPct(s.schema.fields.gtin * 100), tone: scoreToTone(s.schema.fields.gtin * 100) },
      ]} />
      <DistBlock title="Validation" segments={[
        { value: s.schema.valid, tone: 'good', label: 'Valid' },
        { value: s.schema.warnings, tone: 'warn', label: 'Warnings' },
        { value: s.schema.errors, tone: 'bad', label: 'Errors' },
      ]} />
      <TopListBlock title="Missing schema" items={s.schema.missingPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: 'no schema',
        onClick: () => drill.toPage(p),
      }))} emptyText="All products have schema" />
      <TopListBlock title="Invalid schema" items={s.schema.invalidPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: p.error,
        onClick: () => drill.toPage(p),
      }))} emptyText="All schema valid" />
      <SegmentBlock title="By category" headers={['Category','Coverage','Errors','Warnings']} rows={s.schema.byCategory.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [fmtPct(c.coverage * 100), c.errors, c.warnings],
      }))} />
      <DrillFooter chips={[
        { label: 'Missing', count: s.schema.missingPages.length },
        { label: 'Errors', count: s.schema.errors },
      ]} />
    </div>
  )
}
