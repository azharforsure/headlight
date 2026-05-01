import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import {
  Card, Section, KpiRow, KpiTile, TopList, ActionRow, EmptyState, compactNum,
} from '../_shared'

export function CompetitorsGaps() {
  const s = useCompetitorsInsights()

  if (!s.competitors.length) return <EmptyState title="No competitors tracked" />

  const highVol = s.gaps.filter((g: any) => Number(g.volume) > 1000).length
  const lowDiff = s.gaps.filter((g: any) => Number(g.kd) < 30).length

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Gap summary" dense>
        <KpiRow>
          <KpiTile label="Total gaps" value={s.gaps.length} tone="info" />
          <KpiTile label="High vol"   value={highVol} tone="good" />
          <KpiTile label="Low diff"   value={lowDiff} tone="good" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Top keyword gaps" dense>
        <TopList 
          items={s.gaps.slice(0, 8).map((g: any) => ({
            id: g.keyword,
            primary: g.keyword,
            secondary: `KD: ${g.kd}`,
            tail: compactNum(g.volume),
          }))}
        />
      </Section></Card>

      <Section title="Actions" dense>
        <ActionRow 
          action={{
            id: 'gap-1',
            title: 'Brief content for gap keywords',
            reason: `${highVol} high-volume keywords are owned by competitors but not us`,
            affected: highVol,
            primary: true
          }}
        />
      </Section>
    </div>
  )
}
