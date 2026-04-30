import React from 'react'
import { Card, Row, SourceChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { PaidStats } from '@/services/right-sidebar/paid'

export function PaidCompetitionTab({ stats }: RsTabProps<PaidStats>) {
  if (stats.source === 'none') return <RsPartial title="No ads connector" reason="Auction insights require Google Ads." />
  const c = stats.competition
  const SRC = { tier: 'authoritative', name: stats.source } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Visibility" right={<SourceChip source={SRC} />}>
        <Row label="Impression share" value={c.impressionSharePct != null ? `${c.impressionSharePct}%` : '—'} />
        <Row label="Top of page %"     value={c.topOfPagePct != null ? `${c.topOfPagePct}%` : '—'} />
      </Card>
      {c.auctionInsights.length > 0 && (
        <Card title="Auction insights">
          {c.auctionInsights.slice(0, 8).map(a => (
            <Row key={a.domain} label={a.domain} value={`${a.overlapPct}% overlap`} />
          ))}
        </Card>
      )}
    </div>
  )
}
