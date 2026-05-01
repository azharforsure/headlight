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

export function AiCrawlability() {
  const { pages, robotsTxt } = useSeoCrawler() as any
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Bot status mix" segments={[
        { value: s.bots.allowed, tone: 'good', label: 'Allowed' },
        { value: s.bots.partial, tone: 'warn', label: 'Partial' },
        { value: s.bots.blocked, tone: 'bad', label: 'Blocked' },
      ]} />
      <DistRowsBlock title="Per-bot status" rows={s.bots.list.slice(0, 8).map((b: any) => ({
        label: b.name, value: b.status, tone: b.status === 'Allowed' ? 'good' : b.status === 'Blocked' ? 'bad' : 'warn',
      }))} />
      <TopListBlock title="Pages blocked by robots.txt" items={s.crawlability.blockedPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, secondary: p.url, tail: 'blocked',
        onClick: () => drill.toPage(p),
      }))} emptyText="Nothing blocked" />
      <SegmentBlock title="By template" headers={['Template','Pages','Allowed','Blocked']} rows={s.crawlability.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, t.allowed, t.blocked],
      }))} />
      <KvBlock title="llms.txt summary" cols={2} items={[
        { label: 'Status', value: s.llmsTxt ? 'Present' : 'Missing' },
        { label: 'Allow rules', value: String(s.llmsTxtAllowCount || 0) },
        { label: 'Disallow rules', value: String(s.llmsTxtDisallowCount || 0) },
        { label: 'Last updated', value: s.llmsTxtUpdated || '—' },
      ]} />
      <DrillFooter chips={[
        { label: 'Blocked', count: s.bots.blocked },
        { label: 'Partial', count: s.bots.partial },
        { label: 'llms.txt', count: s.llmsTxt ? 'on' : 'off' },
      ]} />
    </div>
  )
}
