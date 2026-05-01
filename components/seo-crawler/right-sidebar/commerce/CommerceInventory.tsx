import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, ActionRow, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function CommerceInventory() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()

  if (!pages?.length || s.total === 0) return <EmptyState title="No product data" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Inventory levels" dense>
        <KpiRow>
          <KpiTile label="In-stock"  value={s.inventory.inStock} tone="good" />
          <KpiTile label="OOS"       value={s.inventory.oos}     tone="bad" />
          <KpiTile label="Backorder" value={s.inventory.backorder} tone="warn" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Stock distribution" dense>
        <Distribution rows={[
          { label: 'In Stock',  value: s.inventory.inStock, tone: 'good' },
          { label: 'Out of Stock', value: s.inventory.oos, tone: 'bad' },
          { label: 'Backorder', value: s.inventory.backorder, tone: 'warn' },
          { label: 'Preorder',  value: s.inventory.preorder, tone: 'info' },
        ]} />
      </Section></Card>

      <Card><Section title="Long-OOS Products" dense>
        <TopList 
          items={s.products
            .filter(p => p.availability === 'out_of_stock' && Number(p.oosDays) > 0)
            .sort((a, b) => Number(b.oosDays) - Number(a.oosDays))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `${p.oosDays}d OOS`,
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'inv-1',
            title: 'Hide OOS from marketing feed',
            reason: `${s.inventory.oos} products are out of stock but may still be in feed`,
            affected: s.inventory.oos,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
