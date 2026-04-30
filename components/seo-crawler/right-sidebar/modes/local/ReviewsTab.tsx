// modes/local/ReviewsTab.tsx
import React from 'react'
import { Card, Row, SourceChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { LocalStats } from '@/services/right-sidebar/local'

export function LocalReviewsTab({ stats }: RsTabProps<LocalStats>) {
  const r = stats.reviews
  if (r.sources.length === 0) return <RsPartial title="No review sources connected" reason="Connect GBP, Yelp, or Tripadvisor." />
  const SRC = { tier: 'authoritative', name: 'Review platforms' } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Aggregate" right={<SourceChip source={SRC} />}>
        <Row label="Avg rating (weighted)" value={r.avgRating != null ? r.avgRating.toFixed(2) : '—'} tone={r.avgRating != null && r.avgRating >= 4.3 ? 'good' : 'warn'} />
        <Row label="Reviews (last 30d)"     value={r.last30dCount} />
      </Card>
      <Card title="By source">
        {r.sources.map(s => (
          <Row key={s.source} label={s.source} hint={`${s.count} reviews`} value={s.rating.toFixed(2)} />
        ))}
      </Card>
    </div>
  )
}
