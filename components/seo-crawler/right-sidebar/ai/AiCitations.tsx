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

export function AiCitations() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Engine mix" segments={[
        { value: s.citations.byEngine.chatgpt, tone: 'good', label: 'ChatGPT' },
        { value: s.citations.byEngine.gemini, tone: 'good', label: 'Gemini' },
        { value: s.citations.byEngine.perplexity, tone: 'good', label: 'Perplexity' },
        { value: s.citations.byEngine.claude, tone: 'good', label: 'Claude' },
        { value: s.citations.byEngine.bing, tone: 'info', label: 'Bing' },
      ]} />
      <DistRowsBlock title="Query intent mix" rows={[
        { label: 'Informational', value: s.citations.byIntent.info, tone: 'info' },
        { label: 'Commercial', value: s.citations.byIntent.comm, tone: 'good' },
        { label: 'Transactional', value: s.citations.byIntent.tx, tone: 'good' },
        { label: 'Navigational', value: s.citations.byIntent.nav, tone: 'neutral' },
      ]} />
      <TrendBlock title="Citations (90d)" values={s.citations.series} tone="good" />
      <TopListBlock title="Most-cited pages" items={s.citations.topPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: `${p.citations}`,
        onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Most-cited queries" items={s.citations.topQueries.slice(0, 6).map((q: any) => ({
        id: q.query, primary: q.query, secondary: q.engine, tail: `${q.count}`,
      }))} />
      <BenchmarkBlock title="Citations vs competitors" site={s.citations.total} benchmark={s.bench.citations} higherIsBetter />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Total', a: { v: s.citations.total, tag: 'now' }, b: { v: s.citations.totalPrev, tag: 'prev' } },
        { label: 'Pages cited', a: { v: s.citations.uniquePages, tag: 'now' }, b: { v: s.citations.uniquePagesPrev, tag: 'prev' } },
      ]} />
      <DrillFooter chips={[
        { label: 'Top engine', count: s.citations.topEngine },
        { label: 'Pages cited', count: s.citations.uniquePages },
      ]} />
    </div>
  )
}
