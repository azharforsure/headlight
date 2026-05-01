import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import {
  Card, Section, KpiRow, KpiTile, TopList, Distribution, ActionRow, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function CompetitorsLosses() {
  const { pages } = useSeoCrawler()
  const s = useCompetitorsInsights()
  const drill = useDrill()

  if (!s.competitors.length) return <EmptyState title="No competitors tracked" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Loss summary" dense>
        <KpiRow>
          <KpiTile label="Keywords lost" value={s.losses.length} tone="bad" />
          <KpiTile label="Biggest drop"  value="-12" tone="bad" />
          <KpiTile label="Recoverable"   value="5" tone="info" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Top competitive losses" dense>
        <TopList 
          items={s.losses.slice(0, 8).map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: `Lost to: ${p.lostToCompetitors?.join(', ')}`,
            tail: `▼${p.positionDrop}`,
            tone: 'bad',
            onClick: () => drill.toPage(p)
          }))}
        />
      </Section></Card>

      <Card><Section title="Loss reasons" dense>
        <Distribution rows={[
          { label: 'Content depth', value: 45, tone: 'bad' },
          { label: 'Freshness',     value: 25, tone: 'warn' },
          { label: 'Backlinks',     value: 15, tone: 'warn' },
          { label: 'Schema/CTR',    value: 15, tone: 'neutral' },
        ]} />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'loss-1',
            title: 'Reclaim lost rankings',
            reason: `${s.losses.length} keywords were overtaken by competitors recently`,
            affected: s.losses.length,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
