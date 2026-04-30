import React from 'react'
import { Card, Row, Bar, SourceChip, FreshnessChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { SocialBrandStats } from '@/services/right-sidebar/socialBrand'

export function SocialTrafficTab({ stats }: RsTabProps<SocialBrandStats>) {
  if (!stats.traffic.ga4Source) return <RsPartial title="Connect GA4" reason="Social traffic requires Google Analytics 4." />
  const t = stats.traffic
  const SRC = { tier: 'authoritative', name: 'GA4' } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Last 30d" right={<><SourceChip source={SRC} /><FreshnessChip at={t.fetchedAt} /></>}>
        <Row label="Social sessions" value={t.last30dSocialSessions?.toLocaleString() ?? '—'} />
      </Card>
      {t.topNetworks.length > 0 && (
        <Card title="By network">
          <Bar data={t.topNetworks.slice(0, 6).map(x => ({ label: x.network.slice(0, 8), value: x.sessions }))} />
        </Card>
      )}
    </div>
  )
}
