import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function LocalLocalPack() {
  const s = useLocalInsights()
  const drill = useDrill()

  if (!s.locations.length) return <EmptyState title="No locations tracked" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Pack visibility" dense>
        <KpiRow>
          <KpiTile label="Avg Pos"   value={s.localPack.avgPosition.toFixed(1)} tone={s.localPack.avgPosition <= 3 ? 'good' : 'warn'} />
          <KpiTile label="Top-3 %"   value={s.localPack.presencePct + '%'} tone="good" />
          <KpiTile label="Coverage"  value="High" tone="info" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Presence by territory" dense>
        <Distribution rows={[
          { label: 'Downtown',    value: 95, tone: 'good' },
          { label: 'West Side',   value: 82, tone: 'good' },
          { label: 'North Hills', value: 45, tone: 'warn' },
          { label: 'South Port',  value: 30, tone: 'bad' },
        ]} />
      </Section></Card>

      <Card><Section title="Weakest territories" dense>
        <TopList 
          items={[
            { id: '1', primary: 'South Port', secondary: 'Presence: 30%', tail: 'Pos 8.2', tone: 'bad' },
            { id: '2', primary: 'North Hills', secondary: 'Presence: 45%', tail: 'Pos 5.5', tone: 'warn' },
          ]}
        />
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Competitors-in-pack" onClick={() => drill.toCategory('competitors', 'Overview')} />
      </div>
    </div>
  )
}
