import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function AiOverview() {
  const { pages, robotsTxt } = useSeoCrawler() as any
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="AI ready"
        scoreHint="Crawlability + citations + entities + schema"
        kpis={[
          { label: 'Citations (30d)', value: s.citations.total },
          { label: 'llms.txt', value: s.llmsTxt ? 'Present' : 'Missing', tone: s.llmsTxt ? 'good' : 'warn' },
          { label: 'Schema score', value: s.schema.score, tone: scoreToTone(s.schema.score) },
        ]} />
      <DistBlock title="Bot allow / block" segments={[
        { value: s.bots.allowed, tone: 'good', label: 'Allowed' },
        { value: s.bots.blocked, tone: 'bad', label: 'Blocked' },
        { value: s.bots.partial, tone: 'warn', label: 'Partial' },
      ]} />
      <DistRowsBlock title="Engine mix (citations)" rows={[
        { label: 'ChatGPT', value: s.citations.byEngine.chatgpt, tone: 'good' },
        { label: 'Gemini', value: s.citations.byEngine.gemini, tone: 'good' },
        { label: 'Perplexity', value: s.citations.byEngine.perplexity, tone: 'good' },
        { label: 'Claude', value: s.citations.byEngine.claude, tone: 'good' },
        { label: 'Bing Copilot', value: s.citations.byEngine.bing, tone: 'info' },
      ]} />
      <TrendBlock title="Citations (90d)" values={s.citations.series} tone="info" />
      <TopListBlock title="Most-cited pages" items={s.citations.topPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: `${p.citations} cites`, onClick: () => drill.toPage(p),
      }))} emptyText="No citations tracked" />
      <SegmentBlock title="By topic" headers={['Topic','Pages','Schema','Cites']} rows={s.entities.list.slice(0, 6).map((e: any) => ({
        id: e.id, label: e.label, values: [e.pages, e.schema, e.citations],
      }))} />
      <BenchmarkBlock title="Schema vs vertical" site={s.schema.score} benchmark={s.bench.schemaScore} unit="%" higherIsBetter />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Citations', a: { v: s.citations.total, tag: 'now' }, b: { v: s.citations.totalPrev, tag: 'prev' } },
        { label: 'Schema score', a: { v: s.schema.score, tag: 'now' }, b: { v: s.schema.scorePrev, tag: 'prev' } },
      ]} />

      <DrillFooter chips={[
        { label: 'Crawlability', count: s.bots.allowed + s.bots.blocked },
        { label: 'Citations', count: s.citations.total },
        { label: 'Entities', count: s.entities.list.length },
        { label: 'Schema', count: s.schema.gaps },
      ]} />
    </div>
  )
}
