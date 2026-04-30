import React from 'react'
import { Card, Row, SourceChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { SocialBrandStats } from '@/services/right-sidebar/socialBrand'

export function SocialEngagementTab({ stats }: RsTabProps<SocialBrandStats>) {
  const e = stats.engagement
  if (e.accounts.length === 0) return <RsPartial title="Connect social accounts" reason="Followers + posts require connecting at least one social account." />
  const SRC = { tier: 'authoritative', name: 'Social accounts' } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Accounts" right={<SourceChip source={SRC} />}>
        {e.accounts.map(a => (
          <Row key={`${a.network}_${a.handle}`} label={`${a.network} · ${a.handle}`} value={a.followers?.toLocaleString() ?? '—'} />
        ))}
      </Card>
      <Card title="Activity">
        <Row label="Posts last 7d"      value={e.last7dPosts ?? '—'} />
        <Row label="Avg engagement rate" value={e.avgEngagementRate != null ? `${(e.avgEngagementRate * 100).toFixed(2)}%` : '—'} />
      </Card>
    </div>
  )
}
