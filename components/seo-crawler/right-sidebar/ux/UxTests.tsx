import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import {
  Card, Section, KpiRow, KpiTile, TopList, ActionRow, Sparkline, EmptyState,
} from '../_shared'

export function UxTests() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Experiments" dense>
        <KpiRow>
          <KpiTile label="Running" value={s.tests.running} tone="info" />
          <KpiTile label="Winning" value={s.tests.winning} tone="good" />
          <KpiTile label="Losing"  value={s.tests.losing}  tone="bad" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Active tests" dense>
        <TopList 
          items={pages
            .filter(p => p.experimentStatus === 'running')
            .slice(0, 3)
            .map(p => ({
              id: p.url,
              primary: p.experimentName || `Test on ${p.url}`,
              secondary: `Lift: +${p.experimentLift}%`,
              tail: <div className="w-12 h-4"><Sparkline values={[10, 12, 11, 15, 14, 18]} tone="good" /></div>
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 't1',
            title: 'Roll out winning variant',
            reason: 'Test "Sticky CTA" shows 12% lift with 98% confidence',
            affected: 1,
            primary: true
          }}
        />
        <ActionRow 
          action={{
            id: 't2',
            title: 'Stop losing experiment',
            reason: 'Test "Blue Header" shows -5% drop in CvR',
            affected: 1
          }}
        />
      </Section>
    </div>
  )
}
