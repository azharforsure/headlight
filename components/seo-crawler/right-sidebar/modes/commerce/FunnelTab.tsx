import React from 'react'
import { Card, Row, StackedBar, SourceChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { CommerceStats } from '@/services/right-sidebar/commerce'

const SRC_CRAWL = { tier: 'scrape', name: 'Crawler' } as const
const SRC_GA4   = { tier: 'authoritative', name: 'GA4' } as const

export function CommerceFunnelTab({ stats }: RsTabProps<CommerceStats>) {
  const f = stats.funnel
  return (
    <div className="flex flex-col gap-3">
      <Card title="Funnel surface" right={<SourceChip source={SRC_CRAWL} />}>
        <Row label="PLP pages"      value={f.plpPages} />
        <Row label="PDP pages"      value={f.pdpPages} />
        <Row label="Cart pages"     value={f.cartPages} />
        <Row label="Checkout pages" value={f.checkoutPages} />
        <StackedBar segments={[
          { value: f.plpPages,      color: '#60a5fa', label: 'PLP' },
          { value: f.pdpPages,      color: '#4ade80', label: 'PDP' },
          { value: f.cartPages,     color: '#fbbf24', label: 'Cart' },
          { value: f.checkoutPages, color: '#f87171', label: 'Checkout' },
        ]} />
      </Card>
      {f.ga4Source ? (
        <Card title="Funnel rates (GA4)" right={<SourceChip source={SRC_GA4} />}>
          <Row label="Add-to-cart rate"     value={f.addToCartRate != null ? `${(f.addToCartRate * 100).toFixed(1)}%` : '—'} />
          <Row label="Cart → checkout rate"  value={f.cartToCheckoutRate != null ? `${(f.cartToCheckoutRate * 100).toFixed(1)}%` : '—'} />
          <Row label="Checkout completion"   value={f.checkoutCompletionRate != null ? `${(f.checkoutCompletionRate * 100).toFixed(1)}%` : '—'} />
        </Card>
      ) : (
        <RsPartial title="Connect GA4" reason="Funnel rates require Google Analytics 4." />
      )}
    </div>
  )
}
