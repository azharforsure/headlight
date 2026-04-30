// modes/local/GbpTab.tsx
import React from 'react'
import { Card, Row, Chip, SourceChip, FreshnessChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { LocalStats } from '@/services/right-sidebar/local'

export function LocalGbpTab({ stats }: RsTabProps<LocalStats>) {
  const g = stats.gbp
  if (g.source === 'none') return <RsPartial title="Connect Google Business Profile" reason="Categories, photos, posts, and hours require GBP." cta={{ label: 'Open Sources', onClick: () => {} }} />
  const SRC = { tier: 'authoritative', name: 'GBP' } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Profile" right={<><SourceChip source={SRC} /><FreshnessChip at={g.fetchedAt} /></>}>
        <Row label="Primary category" value={g.primaryCategory ?? '—'} />
        {g.additionalCategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {g.additionalCategories.map(c => <Chip key={c} tone="neutral" dense>{c}</Chip>)}
          </div>
        )}
      </Card>
      <Card title="Activity">
        <Row label="Photos"            value={g.photos ?? '—'}    tone={(g.photos ?? 0) >= 20 ? 'good' : 'warn'} />
        <Row label="Posts (7d)"         value={g.posts7d ?? '—'}   tone={(g.posts7d ?? 0) >= 1 ? 'good' : 'warn'} />
        <Row label="Hours complete"     value={g.hoursComplete === true ? 'yes' : g.hoursComplete === false ? 'no' : '—'} tone={g.hoursComplete ? 'good' : 'warn'} />
      </Card>
    </div>
  )
}
