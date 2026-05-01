import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState,
} from '../_shared'

export function LocalNap() {
  const s = useLocalInsights()

  if (!s.locations.length) return <EmptyState title="No locations tracked" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Consistency summary" dense>
        <KpiRow>
          <KpiTile label="Consistent" value={s.nap.consistent} tone="good" />
          <KpiTile label="Mismatch"   value={s.nap.mismatch}   tone="warn" />
          <KpiTile label="Missing"    value={s.nap.noData}     tone="neutral" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Source coverage" dense>
        <Distribution rows={[
          { label: 'Website', value: 100, tone: 'good' },
          { label: 'GBP',     value: 95,  tone: 'good' },
          { label: 'Yelp',    value: 70,  tone: 'info' },
          { label: 'Apple',   value: 65,  tone: 'info' },
          { label: 'Bing',    value: 40,  tone: 'warn' },
        ]} />
      </Section></Card>

      <Card><Section title="Biggest mismatches" dense>
        <TopList 
          items={s.locations
            .filter((l: any) => l.napConsistencyScore < 0.9)
            .slice(0, 5)
            .map((l: any) => ({
              id: l.id,
              primary: l.name,
              secondary: `Score: ${Math.round(l.napConsistencyScore * 100)}%`,
              tail: 'Fix',
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'nap-1',
            title: 'Resync NAP data across web',
            reason: `${s.nap.mismatch} locations have inconsistent business data`,
            affected: s.nap.mismatch,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
