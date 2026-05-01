import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiTile, KpiRow,
  TopList, ActionRow, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditOpportunities() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Opportunities" dense>
          <KpiRow>
            <KpiTile label="Striking Distance" value={s.oppRanks.length} tone="info" />
            <KpiTile label="Losing Traffic" value={s.search.losing} tone="bad" />
            <KpiTile label="Low CTR" value={Math.round(s.search.imprTotal * 0.01)} tone="warn" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Top Striking Distance" dense>
          <TopList 
            items={s.oppRanks.slice(0, 5).map(p => ({
              id: p.url,
              primary: p.title || p.url,
              secondary: p.url,
              tail: `#${Number(p.gscPosition).toFixed(1)}`,
              onClick: () => drill.toPage(p)
            }))}
          />
        </Section>
      </Card>

      <Card>
        <Section title="Recommended Actions" dense>
          <ActionRow 
            action={{
              id: 'rewrite-titles',
              title: 'Rewrite Title & Meta',
              reason: '8 pages have low CTR despite high impressions',
              forecast: '+8% CTR est',
              affected: 8,
              primary: true
            }}
            onApprove={() => {}}
          />
        </Section>
      </Card>
    </div>
  )
}
