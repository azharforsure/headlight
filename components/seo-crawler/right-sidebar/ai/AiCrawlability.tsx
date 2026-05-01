import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, ActionRow, EmptyState,
} from '../_shared'

export function AiCrawlability() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const bots = Object.keys(s.botRules)

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Bot rules summary" dense>
        <KpiRow>
          <KpiTile label="Blocked" value={s.blockedBotsCount} tone={s.blockedBotsCount > 0 ? 'warn' : 'neutral'} />
          <KpiTile label="Allowed" value={bots.length - s.blockedBotsCount} tone="good" />
          <KpiTile label="No rule" value="Default" tone="info" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="AI Bot Matrix" dense>
        <Distribution rows={bots.map(bot => ({
          label: bot,
          value: s.botRules[bot] ? 0 : 100, // 0 if blocked, 100 if allowed for visualization
          tone: s.botRules[bot] ? 'bad' : 'good'
        }))} />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'ai-c1',
            title: 'Add llms.txt to root',
            reason: 'Identify your content for LLM crawlers explicitly',
            primary: true
          }}
        />
        {s.blockedBotsCount > 0 && (
          <ActionRow 
            action={{
              id: 'ai-c2',
              title: 'Unblock high-intent AI bots',
              reason: 'Applebot and Google-Extended are blocked',
              affected: s.blockedBotsCount
            }}
          />
        )}
      </Section>
    </div>
  )
}
