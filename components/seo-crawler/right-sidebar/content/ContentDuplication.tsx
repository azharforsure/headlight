import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import {
  Card, Section, KpiTile, KpiRow, BarStack, 
  TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function ContentDuplication() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Duplicate KPI" dense>
          <KpiRow>
            <KpiTile label="Exact" value={s.dup.exact} tone="bad" />
            <KpiTile label="Near"  value={s.dup.near} tone="warn" />
            <KpiTile label="Cannibal" value={s.dup.cannibal} tone="bad" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Type Breakdown" dense>
          <BarStack segments={[
            { value: s.dup.exact,    tone: 'bad',  label: 'Exact' },
            { value: s.dup.near,     tone: 'warn', label: 'Near' },
            { value: s.dup.cannibal, tone: 'bad',  label: 'Cannibal' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Top Exact Duplicates" dense>
          <TopList items={pages
            .filter(p => p.duplicate === true)
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.url,
              tail: 'Exact',
              onClick: () => drill.toPage(p)
            }))} />
        </Section>
      </Card>
    </div>
  )
}
