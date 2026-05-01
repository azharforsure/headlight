import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, AlertRow, EmptyState, compactNum,
} from '../_shared'

export function SocialMentions() {
  const { pages } = useSeoCrawler()
  const s = useSocialInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Sentiment mix" dense>
        <KpiRow>
          <KpiTile label="Positive" value={s.sentiment.pos} tone="good" />
          <KpiTile label="Neutral"  value={s.sentiment.neu} />
          <KpiTile label="Negative" value={s.sentiment.neg} tone="bad" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Source distribution" dense>
        <Distribution rows={[
          { label: 'X (Twitter)', value: s.mentions.filter((m: any) => m.source === 'x').length, tone: 'info' },
          { label: 'LinkedIn',    value: s.mentions.filter((m: any) => m.source === 'linkedin').length, tone: 'info' },
          { label: 'Reddit',      value: s.mentions.filter((m: any) => m.source === 'reddit').length, tone: 'info' },
          { label: 'YouTube',     value: s.mentions.filter((m: any) => m.source === 'youtube').length, tone: 'info' },
        ]} />
      </Section></Card>

      <Card><Section title="Top mentioners" dense>
        <TopList 
          items={s.topMentioners.map((m: any) => ({
            id: m.id,
            primary: m.user,
            secondary: m.text,
            tail: compactNum(m.reach),
            tone: m.sentiment < -0.1 ? 'bad' : 'neutral'
          }))}
        />
      </Section></Card>

      <Card><Section title="Crisis signals" dense>
        {s.sentiment.neg > 10 && (
          <AlertRow alert={{ id: 'c1', tone: 'bad', title: 'Viral negative thread on Reddit' }} />
        )}
        <AlertRow alert={{ id: 'c2', tone: 'info', title: 'No major brand crisis detected' }} />
      </Section></Card>
    </div>
  )
}

