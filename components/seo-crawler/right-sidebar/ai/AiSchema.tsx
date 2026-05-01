import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function AiSchema() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Schema type mix" segments={s.schema.types.slice(0, 6).map((t: any, i: number) => ({
        value: t.count, tone: ['good','info','warn','neutral','bad','info'][i] as any, label: t.type,
      }))} />
      <DistRowsBlock title="AI-key fields coverage" rows={[
        { label: 'about / mentions', value: fmtPct(s.schema.fields.about), tone: scoreToTone(s.schema.fields.about) },
        { label: 'sameAs', value: fmtPct(s.schema.fields.sameAs), tone: scoreToTone(s.schema.fields.sameAs) },
        { label: 'author', value: fmtPct(s.schema.fields.author), tone: scoreToTone(s.schema.fields.author) },
        { label: 'datePublished', value: fmtPct(s.schema.fields.datePublished), tone: scoreToTone(s.schema.fields.datePublished) },
      ]} />
      <TopListBlock title="Pages missing schema" items={s.schema.missingPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: 'no schema',
        onClick: () => drill.toPage(p),
      }))} emptyText="All pages have schema" />
      <TopListBlock title="Pages with schema errors" items={s.schema.errorPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: p.error,
        onClick: () => drill.toPage(p),
      }))} emptyText="No schema errors" />
      <SegmentBlock title="By template" headers={['Template','Coverage','Errors','Warnings']} rows={s.schema.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [fmtPct(t.coverage), t.errors, t.warnings],
      }))} />
      <DrillFooter chips={[
        { label: 'Missing', count: s.schema.missingPages.length },
        { label: 'Errors', count: s.schema.errors },
      ]} />
    </div>
  )
}
