import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function AiSchema() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const schemaCoverage = Math.round((s.extractability.hasFaq + s.extractability.hasHowto + s.entities.hasOrg) / 3)

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="AI Schema coverage" dense>
        <KpiRow>
          <KpiTile label="Coverage" value={schemaCoverage + '%'} />
          <KpiTile label="FAQ"      value={s.extractability.hasFaq + '%'} tone="info" />
          <KpiTile label="HowTo"    value={s.extractability.hasHowto + '%'} tone="info" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Schema types coverage" dense>
        <Distribution rows={[
          { label: 'Organization', value: s.entities.hasOrg, tone: 'good' },
          { label: 'WebSite',      value: s.entities.hasWebsite, tone: 'good' },
          { label: 'FAQPage',      value: s.extractability.hasFaq, tone: 'info' },
          { label: 'HowTo',        value: s.extractability.hasHowto, tone: 'info' },
          { label: 'Speakable',    value: 5, tone: 'warn' },
        ]} />
      </Section></Card>

      <Card><Section title="High answer-box fit" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.answerBoxFitScore) >= 0.7)
            .sort((a, b) => Number(b.answerBoxFitScore) - Number(a.answerBoxFitScore))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `${Math.round(Number(p.answerBoxFitScore) * 100)}%`,
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'ai-s1',
            title: 'Add answer schema (FAQ)',
            reason: `${100 - s.extractability.hasFaq}% of pages could benefit from FAQ blocks`,
            forecast: 'Boost AI snippets',
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
