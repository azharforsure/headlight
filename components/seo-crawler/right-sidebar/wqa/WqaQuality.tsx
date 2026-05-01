import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import {
  Card, Section, KpiTile, KpiRow, ScoreBreakdown, BulletGauge,
  TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function WqaQuality() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Quality vs Target" dense>
          <BulletGauge value={s.qOverall} target={85} label="Site Quality Score" />
        </Section>
      </Card>

      <Card>
        <Section title="Distribution" dense>
          <KpiRow>
            <KpiTile label="High" value={s.quality.high} tone="good" />
            <KpiTile label="Medium" value={s.quality.med} tone="warn" />
            <KpiTile label="Low" value={s.quality.low} tone="bad" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Pillar Breakdown" dense>
          <ScoreBreakdown scores={[
            { label: 'Content', score: s.pillars.content },
            { label: 'Search',  score: s.pillars.search },
            { label: 'Technical', score: s.pillars.tech },
            { label: 'Links',   score: s.pillars.authority },
            { label: 'EEAT',    score: s.pillars.eeat },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Recent Movers" dense>
          <TopList 
            items={s.movers.up.map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `▲ ${Number(p.sessionsDeltaPct).toFixed(1)}%`,
              onClick: () => drill.toPage(p)
            }))}
          />
        </Section>
      </Card>
    </div>
  )
}
