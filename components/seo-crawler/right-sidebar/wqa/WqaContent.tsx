import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import {
  Card, Section, KpiTile, KpiRow, Distribution,
  TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function WqaContent() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Content Quality" dense>
          <KpiRow>
            <KpiTile label="Thin (<300)" value={s.wcDist[0]?.count || 0} tone="bad" />
            <KpiTile label="Duplicate" value={s.dupes} tone="bad" />
            <KpiTile label="Decay" value={s.stale} tone="warn" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Word Count" dense>
          <Distribution rows={s.wcDist} />
        </Section>
      </Card>

      <Card>
        <Section title="Stalest Content" dense>
          <TopList 
            items={pages
              .filter(p => Number(p.daysSinceUpdate) > 0)
              .sort((a, b) => Number(b.daysSinceUpdate) - Number(a.daysSinceUpdate))
              .slice(0, 5)
              .map(p => ({
                id: p.url,
                primary: p.title || p.url,
                tail: `${p.daysSinceUpdate}d`,
                onClick: () => drill.toPage(p)
              }))}
          />
        </Section>
      </Card>
    </div>
  )
}
