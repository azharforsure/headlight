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

export function AiEntities() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Type mix" segments={[
        { value: s.entities.types.person, tone: 'info', label: 'Person' },
        { value: s.entities.types.org, tone: 'info', label: 'Organization' },
        { value: s.entities.types.place, tone: 'info', label: 'Place' },
        { value: s.entities.types.product, tone: 'good', label: 'Product' },
        { value: s.entities.types.event, tone: 'info', label: 'Event' },
      ]} />
      <DistRowsBlock title="Source mix" rows={[
        { label: 'Schema.org', value: s.entities.sources.schema, tone: 'good' },
        { label: 'Wikipedia', value: s.entities.sources.wikipedia, tone: 'good' },
        { label: 'Wikidata', value: s.entities.sources.wikidata, tone: 'good' },
        { label: 'Knowledge graph', value: s.entities.sources.kg, tone: 'good' },
      ]} />
      <TopListBlock title="Top entities" items={s.entities.list.slice(0, 6).map((e: any) => ({
        id: e.id, primary: e.label, secondary: e.type,
        tail: `${e.pages} pages · ${e.citations} cites`,
      }))} />
      <TopListBlock title="Entity gaps" items={s.entities.gapList.slice(0, 6).map((e: any) => ({
        id: e.id, primary: e.label, tail: 'no schema',
      }))} emptyText="No entity gaps" />
      <SegmentBlock title="By page cluster" headers={['Cluster','Entities','Schema','Gaps']} rows={s.entities.byCluster.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [c.entities, c.schema, c.gaps],
      }))} />
      <DrillFooter chips={[
        { label: 'Gaps', count: s.entities.gaps },
        { label: 'Schema', count: s.entities.withSchema },
      ]} />
    </div>
  )
}
