import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState, fmtNum,
} from '../_shared'

export function LocalReviews() {
  const s = useLocalInsights()

  if (!s.reviewSources.length) return <EmptyState title="No reviews aggregated" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Review overview" dense>
        <KpiRow>
          <KpiTile label="Total"    value={fmtNum(s.rev.total)} />
          <KpiTile label="Avg"      value={s.rev.avg.toFixed(1)} tone={s.rev.avg >= 4 ? 'good' : 'warn'} />
          <KpiTile label="Neg 30d"  value={s.rev.negative30d} tone={s.rev.negative30d > 0 ? 'bad' : 'neutral'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Rating buckets" dense>
        <Distribution rows={[
          { label: '5 ★', value: 70, tone: 'good' },
          { label: '4 ★', value: 15, tone: 'good' },
          { label: '3 ★', value: 8,  tone: 'neutral' },
          { label: '2 ★', value: 4,  tone: 'warn' },
          { label: '1 ★', value: 3,  tone: 'bad' },
        ]} />
      </Section></Card>

      <Card><Section title="Unresponded negatives" dense>
        <TopList 
          items={[
            { id: '1', primary: 'Bad service experience', secondary: '2 days ago · Google', tail: '1 ★', tone: 'bad' },
            { id: '2', primary: 'Order missing item', secondary: '5 days ago · Yelp', tail: '2 ★', tone: 'bad' },
          ]}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'rev-1',
            title: 'Respond to negative reviews',
            reason: `${s.rev.negative30d} negative reviews need official responses`,
            affected: s.rev.negative30d,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
