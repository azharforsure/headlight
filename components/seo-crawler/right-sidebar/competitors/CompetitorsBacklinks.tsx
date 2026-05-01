import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import {
  Card, Section, KpiRow, KpiTile, TopList, Distribution, EmptyState, fmtNum,
} from '../_shared'

export function CompetitorsBacklinks() {
  const s = useCompetitorsInsights()

  if (!s.competitors.length) return <EmptyState title="No competitors tracked" />

  const shared = s.backlinks.reduce((a, b) => a + b.shared, 0)
  const theirs = s.backlinks.reduce((a, b) => a + b.onlyTheirs, 0)

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Link intersection" dense>
        <KpiRow>
          <KpiTile label="Shared domains" value={fmtNum(shared)} />
          <KpiTile label="Comp-only"      value={fmtNum(theirs)} tone="warn" />
          <KpiTile label="Our-only"       value="124" tone="good" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Prospecting (Comp-only)" dense>
        <TopList 
          items={[
            { id: '1', primary: 'industry-journal.com', secondary: 'Links to: 3 comps', tail: 'DR 72' },
            { id: '2', primary: 'tech-blog.io', secondary: 'Links to: 2 comps', tail: 'DR 65' },
            { id: '3', primary: 'review-site.net', secondary: 'Links to: 4 comps', tail: 'DR 58' },
          ]}
        />
      </Section></Card>

      <Card><Section title="DR Distribution" dense>
        <Distribution rows={[
          { label: 'DR 70+', value: 15, tone: 'good' },
          { label: 'DR 40-70', value: 45, tone: 'info' },
          { label: 'DR 10-40', value: 30, tone: 'neutral' },
          { label: 'DR <10', value: 10, tone: 'warn' },
        ]} />
      </Section></Card>
    </div>
  )
}
