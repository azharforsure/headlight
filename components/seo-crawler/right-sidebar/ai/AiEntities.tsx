import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import {
  Card, Section, KpiRow, KpiTile, TopList, AlertRow, EmptyState,
} from '../_shared'

export function AiEntities() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Knowledge anchoring" dense>
        <KpiRow>
          <KpiTile label="Org Schema" value={s.entities.hasOrg + '%'} tone={s.entities.hasOrg > 80 ? 'good' : 'warn'} />
          <KpiTile label="SameAs"     value="42%" tone="info" />
          <KpiTile label="Entity Den" value={s.entities.avgEntityDensity.toFixed(1)} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Primary entities detected" dense>
        <TopList 
          items={[
            { id: 'e1', primary: 'Search Engine Optimization', secondary: 'Topics: 124', tail: '0.85 rel' },
            { id: 'e2', primary: 'Digital Marketing', secondary: 'Topics: 85', tail: '0.72 rel' },
            { id: 'e3', primary: 'Software as a Service', secondary: 'Topics: 42', tail: '0.65 rel' },
          ]}
        />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        <AlertRow alert={{ id: 'a1', tone: 'warn', title: 'Missing peer entity "Content Strategy" context' }} />
        <AlertRow alert={{ id: 'a2', tone: 'bad', title: 'Weak knowledge graph anchoring for "Brand"' }} />
      </Section></Card>
    </div>
  )
}
