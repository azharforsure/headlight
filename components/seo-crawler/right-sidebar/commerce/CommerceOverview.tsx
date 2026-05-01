import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import {
  Card, Section, KpiRow, KpiTile, BarStack, AlertRow, DrillChip, EmptyState, fmtNum, fmtPct,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function CommerceOverview() {
  const { pages, fp } = useSeoCrawler() as any
  const s = useCommerceInsights()
  const drill = useDrill()

  const isEcom = fp?.industry === 'ecommerce' || s.total > 0

  if (!pages?.length) return <EmptyState title="No crawl data yet" />
  if (!isEcom) {
    return <EmptyState title="Non-commerce site" hint="Commerce insights are gated for e-commerce sites or pages with Product schema." />
  }

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Commerce snapshot" dense>
        <KpiRow>
          <KpiTile label="Products"   value={fmtNum(s.total)} />
          <KpiTile label="In-stock"   value={fmtPct(s.inventory.inStock / s.total * 100)} tone="good" />
          <KpiTile label="Schema valid" value={fmtPct(s.schema.validProduct)} tone={s.schema.validProduct > 80 ? 'good' : 'warn'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Availability mix" dense>
        <BarStack segments={[
          { value: s.inventory.inStock,   tone: 'good', label: 'In Stock' },
          { value: s.inventory.oos,       tone: 'bad',  label: 'OOS' },
          { value: s.inventory.backorder, tone: 'warn', label: 'Backorder' },
          { value: s.inventory.preorder,  tone: 'info', label: 'Preorder' },
        ]} />
      </Section></Card>

      <Card><Section title="Top Alerts" dense>
        {s.inventory.oos > 0 && (
          <AlertRow alert={{ id: 'oos', tone: 'bad', title: 'Out of stock products', count: s.inventory.oos }} />
        )}
        {s.schema.missingGtin > 0 && (
          <AlertRow alert={{ id: 'gtin', tone: 'warn', title: 'Products missing GTIN/MPN', count: s.schema.missingGtin }} />
        )}
        {s.schema.validProduct < 100 && (
          <AlertRow alert={{ id: 'sv', tone: 'bad', title: 'Invalid product schema detected' }} />
        )}
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Inventory" count={s.inventory.oos} />
        <DrillChip label="Feed"      count={s.feed.errors} />
        <DrillChip label="Reviews"   />
      </div>
    </div>
  )
}
