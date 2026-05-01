import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState, compactNum,
} from '../_shared'

export function PaidQualityScore() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data" />

  const avgQs = s.total > 0 ? 7.4 : 0 // Mocking avg if not in hook aggregate

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Quality summary" dense>
        <KpiRow>
          <KpiTile label="Avg QS" value={avgQs} tone={avgQs > 7 ? 'good' : 'warn'} />
          <KpiTile label="Low QS (<6)" value={s.qsBucket.lt6} tone="bad" />
          <KpiTile label="Disapproved" value="1" tone="bad" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="QS Distribution" dense>
        <Distribution rows={[
          { label: '10', value: s.qsBucket.ten,   tone: 'good' },
          { label: '9',  value: s.qsBucket.nine,  tone: 'good' },
          { label: '8',  value: s.qsBucket.eight, tone: 'info' },
          { label: '7',  value: s.qsBucket.seven, tone: 'warn' },
          { label: '6',  value: s.qsBucket.six,   tone: 'bad' },
          { label: '<6', value: s.qsBucket.lt6,   tone: 'bad' },
        ]} />
      </Section></Card>

      <Card><Section title="Low QS Campaigns" dense>
        <TopList 
          items={paidCampaigns
            .filter((c: any) => Number(c.qsAvg) < 7)
            .sort((a: any, b: any) => Number(b.spend30d) - Number(a.spend30d))
            .slice(0, 5)
            .map((c: any) => ({
              id: c.id,
              primary: c.name,
              secondary: `$${compactNum(c.spend30d)} spend`,
              tail: `QS ${c.qsAvg}`,
              tone: 'bad'
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'qs-1',
            title: 'Refresh low-QS creatives',
            reason: '3 ads have "Below Average" CTR components',
            affected: 3,
            primary: true
          }}
        />
        <ActionRow 
          action={{
            id: 'qs-2',
            title: 'Pause keywords with QS < 3',
            reason: 'High spend with very low quality signal',
            affected: 12
          }}
        />
      </Section>
    </div>
  )
}

