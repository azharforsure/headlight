import React from 'react'
import { Card, Row, SourceChip, FreshnessChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { CommerceStats } from '@/services/right-sidebar/commerce'

export function CommerceFeedTab({ stats }: RsTabProps<CommerceStats>) {
  const f = stats.feed
  if (f.source === 'none') return <RsPartial title="Connect Merchant Center or Shopify" reason="Feed health requires a product feed source." cta={{ label: 'Open Sources', onClick: () => {} }} />
  const SRC = { tier: 'authoritative', name: f.source } as const
  return (
    <Card title="Feed health" right={<><SourceChip source={SRC} /><FreshnessChip at={f.fetchedAt} /></>}>
      <Row label="Items"         value={f.items?.toLocaleString() ?? '—'} />
      <Row label="Active"         value={f.activeItems?.toLocaleString() ?? '—'} />
      <Row label="Disapproved"    value={f.disapprovedItems?.toLocaleString() ?? '—'} tone={(f.disapprovedItems ?? 0) === 0 ? 'good' : 'bad'} />
    </Card>
  )
}
