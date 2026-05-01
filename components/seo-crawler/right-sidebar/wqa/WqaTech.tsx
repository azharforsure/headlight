import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import {
  Card, Section, MetricRow, BarStack, 
  DrillChip, EmptyState,
  fmtPct,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function WqaTech() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Status Distribution" dense>
          <BarStack segments={[
            { value: s.status.ok,       tone: 'good', label: '2xx' },
            { value: s.status.redirect, tone: 'info', label: '3xx' },
            { value: s.status.client,   tone: 'bad',  label: '4xx' },
            { value: s.status.server,   tone: 'bad',  label: '5xx' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Indexing & Crawl" dense>
          <MetricRow label="Indexable" value={fmtPct(s.indexable / s.total * 100)} tone="good" />
          <MetricRow label="Noindex" value={s.noindex} tone="warn" />
          <MetricRow label="Blocked" value={s.blocked} tone="bad" />
          <MetricRow label="Orphans" value={s.orphans} tone="warn" />
        </Section>
      </Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Technical Details" onClick={() => {}} />
      </div>
    </div>
  )
}
