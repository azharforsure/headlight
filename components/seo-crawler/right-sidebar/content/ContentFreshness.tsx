import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import {
  Card, Section, KpiTile, KpiRow, Distribution,
  TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function ContentFreshness() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Freshness Overview" dense>
          <KpiRow>
            <KpiTile label="<7d" value={s.fresh.lt7d} tone="good" />
            <KpiTile label="<30d" value={s.fresh.lt30d} tone="info" />
            <KpiTile label="Stale" value={s.fresh.stale} tone="bad" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Age Distribution" dense>
          <Distribution rows={[
            { label: '<7 Days',   value: s.fresh.lt7d, tone: 'good' },
            { label: '<30 Days',  value: s.fresh.lt30d, tone: 'info' },
            { label: '<90 Days',  value: s.fresh.lt90d, tone: 'neutral' },
            { label: '<365 Days', value: s.fresh.lt365d, tone: 'neutral' },
            { label: 'Stale (1y+)', value: s.fresh.stale, tone: 'bad' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Stalest Pages with Traffic" dense>
          <TopList items={pages
            .filter(p => Number(p.daysSinceUpdated) >= 365 && Number(p.gscClicks) > 0)
            .sort((a, b) => Number(b.gscClicks) - Number(a.gscClicks))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `${p.daysSinceUpdated}d`,
              onClick: () => drill.toPage(p)
            }))} />
        </Section>
      </Card>
    </div>
  )
}
