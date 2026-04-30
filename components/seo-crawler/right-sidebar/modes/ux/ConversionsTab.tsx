import React from 'react'
import { Card, Row, SourceChip, FreshnessChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { UxConversionStats } from '@/services/right-sidebar/uxConversion'

const SRC_CRAWL = { tier: 'scrape', name: 'Crawler' } as const
const SRC_GA4   = { tier: 'authoritative', name: 'GA4' } as const

export function UxConversionsTab({ stats }: RsTabProps<UxConversionStats>) {
  const c = stats.conversions
  return (
    <div className="flex flex-col gap-3">
      <Card title="Conversion surface" right={<SourceChip source={SRC_CRAWL} />}>
        <Row label="Pages with CTA"      value={c.pagesWithCta} />
        <Row label="Pages with forms"     value={c.pagesWithForms} />
        <Row label="Checkout / cart pages" value={c.checkoutPages} />
      </Card>
      {c.ga4Source ? (
        <Card title="GA4 conversions" right={<><SourceChip source={SRC_GA4} /><FreshnessChip at={c.fetchedAt} /></>}>
          <Row label="Conversions"     value={c.ga4Conversions?.toLocaleString() ?? '—'} />
          <Row label="Conversion rate" value={c.ga4ConversionRate != null ? `${(c.ga4ConversionRate * 100).toFixed(2)}%` : '—'} />
        </Card>
      ) : (
        <RsPartial title="Connect GA4" reason="Conversion volume + rate require Google Analytics 4." cta={{ label: 'Open Sources', onClick: () => {} }} />
      )}
    </div>
  )
}
