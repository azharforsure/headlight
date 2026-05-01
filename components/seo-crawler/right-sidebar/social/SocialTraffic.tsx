import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, AlertRow, EmptyState, compactNum,
} from '../_shared'

export function SocialTraffic() {
  const { pages } = useSeoCrawler()
  const s = useSocialInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Social funnel" dense>
        <KpiRow>
          <KpiTile label="Sessions" value={compactNum(s.traffic.socialSessions)} />
          <KpiTile label="Social CvR" value={s.traffic.cvr.toFixed(2) + '%'} tone="good" />
          <KpiTile label="Revenue" value={'$' + compactNum(s.traffic.socialSessions * 0.42)} tone="good" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Platform traffic" dense>
        <Distribution rows={[
          { label: 'LinkedIn', value: 40, tone: 'info' },
          { label: 'X',        value: 25, tone: 'info' },
          { label: 'Reddit',   value: 20, tone: 'info' },
          { label: 'Other',    value: 15, tone: 'neutral' },
        ]} />
      </Section></Card>

      <Card><Section title="Top social landing pages" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.socialSessions) > 0)
            .sort((a, b) => Number(b.socialSessions) - Number(a.socialSessions))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: compactNum(Number(p.socialSessions)),
            }))}
        />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        <AlertRow alert={{ id: 'b1', tone: 'warn', title: 'High bounce rate on Reddit traffic (85%)' }} />
      </Section></Card>
    </div>
  )
}
