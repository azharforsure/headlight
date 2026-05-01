import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, AlertRow, EmptyState,
} from '../_shared'

export function UxForms() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const totalStarts = pages.reduce((a, p) => a + Number(p.formStarts || 0), 0)
  const totalCompletes = pages.reduce((a, p) => a + Number(p.formCompletes || 0), 0)
  const completeRate = totalStarts > 0 ? (totalCompletes / totalStarts * 100).toFixed(1) : '0'

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Form performance" dense>
        <KpiRow>
          <KpiTile label="Starts" value={totalStarts} />
          <KpiTile label="Completes" value={totalCompletes} tone="good" />
          <KpiTile label="Rate" value={completeRate + '%'} tone="good" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Typical field drop" dense>
        <Distribution rows={[
          { label: 'Name', value: 100, tone: 'good' },
          { label: 'Email', value: 95, tone: 'good' },
          { label: 'Phone', value: 45, tone: 'bad' },
          { label: 'Submit', value: 42, tone: 'good' },
        ]} />
      </Section></Card>

      <Card><Section title="Highest abandon forms" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.formAbandonCount) > 0)
            .sort((a, b) => Number(b.formAbandonCount) - Number(a.formAbandonCount))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: `Form on ${p.url}`,
              tail: `${p.formAbandonCount} drops`,
            }))}
        />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        <AlertRow alert={{ id: 'f1', tone: 'bad', title: 'Phone field has 55% drop rate' }} />
        <AlertRow alert={{ id: 'f2', tone: 'warn', title: 'Validation error spike on zip code' }} />
      </Section></Card>
    </div>
  )
}
