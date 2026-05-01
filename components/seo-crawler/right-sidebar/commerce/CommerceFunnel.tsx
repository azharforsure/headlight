import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import {
  Card, Section, KpiTile, BarStack, TopList, ActionRow, EmptyState, compactNum,
} from '../_shared'

export function CommerceFunnel() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()

  if (!pages?.length || s.total === 0) return <EmptyState title="No product data" />

  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="PDP Views"  value={compactNum(s.funnel.pdpViews)} />
        <KpiTile label="Add to Cart" value={compactNum(s.funnel.atc)} tone="info" />
        <KpiTile label="Checkouts"   value={compactNum(s.funnel.checkouts)} tone="warn" />
        <KpiTile label="Purchases"   value={compactNum(s.funnel.purchases)} tone="good" />
      </div>

      <Card><Section title="E-com funnel" dense>
        <BarStack segments={[
          { value: s.funnel.pdpViews,  tone: 'neutral', label: 'View' },
          { value: s.funnel.atc,       tone: 'info',    label: 'ATC' },
          { value: s.funnel.checkouts, tone: 'warn',    label: 'Check' },
          { value: s.funnel.purchases, tone: 'good',    label: 'Buy' },
        ]} />
      </Section></Card>

      <Card><Section title="Largest drop-off" dense>
        <TopList 
          items={[
            { id: '1', primary: 'ATC → Checkout', tail: '72% drop', tone: 'bad' },
            { id: '2', primary: 'Checkout → Purchase', tail: '15% drop', tone: 'info' },
          ]}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'fun-1',
            title: 'Improve checkout flow',
            reason: '72% drop-off detected at the checkout initiation step',
            forecast: '+8% revenue est',
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
