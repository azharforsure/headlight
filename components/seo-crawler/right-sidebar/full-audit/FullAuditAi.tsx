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

export function FullAuditAi() {
  const { pages, robotsTxt } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const cited = (s.ai.citedPages || []).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Bot allow mix" segments={[
        { value: s.ai.allowedBots, tone: 'good', label: 'Allowed' },
        { value: s.ai.blockedBots, tone: 'bad', label: 'Blocked' },
      ]} />
      <DistRowsBlock title="Entity coverage" rows={[
        { label: 'Person', value: s.ai.entities.person, tone: 'info' },
        { label: 'Organization', value: s.ai.entities.org, tone: 'info' },
        { label: 'Place', value: s.ai.entities.place, tone: 'info' },
        { label: 'Product', value: s.ai.entities.product, tone: 'info' },
      ]} />
      <TopListBlock title="Most-cited pages" items={cited.map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: `${p.citations} cites`,
        onClick: () => drill.toPage(p),
      }))} emptyText="No citations tracked" />
      <SegmentBlock title="By entity" headers={['Entity', 'Pages', 'Schema', 'Cites']} rows={s.ai.entitySegments.slice(0, 6).map((e: any) => ({
        id: e.id, label: e.label, values: [e.pages, e.schema, e.citations],
      }))} />

      <DrillFooter chips={[
        { label: 'Crawlability', count: s.ai.allowedBots + s.ai.blockedBots, onClick: () => drill.toCategory('ai', 'Crawlability') },
        { label: 'Citations', count: s.ai.citations, onClick: () => drill.toCategory('ai', 'Citations') },
        { label: 'Schema', count: s.ai.schemaScore, onClick: () => drill.toCategory('ai', 'Schema') },
      ]} />
    </div>
  )
}
