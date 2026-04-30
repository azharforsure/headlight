import React from 'react'
import { Card, Row, SourceChip, FreshnessChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { SocialBrandStats } from '@/services/right-sidebar/socialBrand'

export function SocialMentionsTab({ stats }: RsTabProps<SocialBrandStats>) {
  const m = stats.mentions
  if (m.source === 'none') return <RsPartial title="Connect a mentions source" reason="Brandwatch or Meltwater required." />
  const SRC = { tier: 'authoritative', name: m.source } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="7-day volume" right={<><SourceChip source={SRC} /><FreshnessChip at={m.fetchedAt} /></>}>
        <Row label="Mentions" value={m.volume7d?.toLocaleString() ?? '—'} />
      </Card>
      {m.topSources.length > 0 && (
        <Card title="Top sources">
          {m.topSources.slice(0, 8).map(s => <Row key={s.domain} label={s.domain} value={s.count} />)}
        </Card>
      )}
    </div>
  )
}
