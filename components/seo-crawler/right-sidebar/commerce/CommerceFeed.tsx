import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState,
} from '../_shared'

export function CommerceFeed() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()

  if (!pages?.length || s.total === 0) return <EmptyState title="No product data" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Merchant feed status" dense>
        <KpiRow>
          <KpiTile label="Approved" value={s.feed.approved} tone="good" />
          <KpiTile label="Warnings" value={s.feed.warnings} tone="warn" />
          <KpiTile label="Errors"   value={s.feed.errors}   tone="bad" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Status mix" dense>
        <Distribution rows={[
          { label: 'Approved', value: s.feed.approved, tone: 'good' },
          { label: 'Warning',  value: s.feed.warnings, tone: 'warn' },
          { label: 'Error',    value: s.feed.errors,   tone: 'bad' },
          { label: 'Missing',  value: s.feed.missing,  tone: 'neutral' },
        ]} />
      </Section></Card>

      <Card><Section title="Feed errors" dense>
        <TopList 
          items={s.products
            .filter(p => p.feedStatus === 'error')
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: p.feedErrorReason || 'Invalid data',
              tone: 'bad'
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'feed-1',
            title: 'Regenerate product feed',
            reason: `${s.feed.errors} products have feed sync errors`,
            affected: s.feed.errors,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
