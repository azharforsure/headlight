import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiTile, KpiRow,
  Distribution, DrillChip, EmptyState,
  compactNum,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditLinks() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Link Summary" dense>
          <KpiRow>
            <KpiTile label="Internal" value={compactNum(s.links.external)} />
            <KpiTile label="Orphans" value={s.links.orphans} tone={s.links.orphans > 0 ? 'warn' : 'neutral'} />
            <KpiTile label="Broken" value={s.links.broken} tone={s.links.broken > 0 ? 'bad' : 'neutral'} />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Authority" dense>
          <KpiTile label="Referring Domains" value={compactNum(s.links.refDomains)} tone="info" />
        </Section>
      </Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Go to Links Mode" onClick={() => {}} />
      </div>
    </div>
  )
}
