import React from 'react'
import { Card, Gauge, Chip, ActionsList, SourceChip, FreshnessChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { CompetitorStats } from '@/services/right-sidebar/competitors'

export function CompOverviewTab({ stats }: RsTabProps<CompetitorStats>) {
  if (stats.source === 'none') {
    return <RsPartial title="Connect Ahrefs or Semrush" reason="Market share and backlink data require a competitive intelligence source." cta={{ label: 'Open Sources', onClick: () => {} }} />
  }
  const SRC = { tier: 'authoritative', name: stats.source } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Competitive health" right={<><SourceChip source={SRC} /><FreshnessChip at={stats.fetchedAt} /></>}>
        <div className="flex items-center gap-3">
          <Gauge value={stats.overall.score} label="score" />
          <div className="flex-1 flex flex-wrap gap-1">
            {stats.overall.chips.map(c => <Chip key={c.label} tone={c.tone}>{c.label}: {c.value}</Chip>)}
          </div>
        </div>
      </Card>
      <Card title="Top fixes"><ActionsList actions={stats.actions.slice(0, 5)} /></Card>
    </div>
  )
}
