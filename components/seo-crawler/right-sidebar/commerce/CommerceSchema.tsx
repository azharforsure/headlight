import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState, fmtPct,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function CommerceSchema() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()

  if (!pages?.length || s.total === 0) return <EmptyState title="No product data" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Schema coverage" dense>
        <KpiRow>
          <KpiTile label="Has Product" value={s.schema.hasProduct + '%'} />
          <KpiTile label="Valid"       value={s.schema.validProduct + '%'} tone={s.schema.validProduct > 80 ? 'good' : 'bad'} />
          <KpiTile label="Has Reviews" value={s.schema.hasReviewSchema + '%'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Field coverage" dense>
        <Distribution rows={[
          { label: 'Name',    value: 100, tone: 'good' },
          { label: 'Image',   value: 98,  tone: 'good' },
          { label: 'Offers',  value: Math.round(s.total - s.schema.missingPrice), tone: 'info' },
          { label: 'Stock',   value: Math.round(s.total - s.schema.missingAvailability), tone: 'info' },
          { label: 'GTIN/MPN', value: Math.round(s.total - s.schema.missingGtin), tone: 'warn' },
        ]} />
      </Section></Card>

      <Card><Section title="Invalid schema products" dense>
        <TopList 
          items={s.products
            .filter(p => p.productSchemaValid === false)
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: 'Invalid',
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'sch-1',
            title: 'Fix product schema errors',
            reason: `${s.products.filter(p => p.productSchemaValid === false).length} products have critical schema errors`,
            affected: s.products.filter(p => p.productSchemaValid === false).length,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
