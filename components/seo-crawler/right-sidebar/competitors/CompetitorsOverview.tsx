import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, BarStack, Distribution,
  TopList, DrillChip, EmptyState, NotConnected, fmtNum,
} from '../_shared'

export function CompetitorsOverview() {
  const s = useCompetitorsInsights()
  const drill = useDrill()

  if (!s.competitors.length) {
    return (
      <NotConnected source="Competitors" onConnect={() => drill.toCategory('competitors', 'Add')} />
    )
  }

  const sovSegs = [
    { value: s.ourSov, tone: 'info' as const, label: 'Us' },
    ...s.competitors.slice(0, 3).map((c: any, i: number) => ({
      value: Number(c.shareOfVoice || 0),
      tone: ['warn', 'bad', 'neutral'][i] as 'warn' | 'bad' | 'neutral',
      label: c.domain,
    })),
  ]

  const top = s.overlap.slice(0, 6).map((o: any) => ({
    id: o.domain,
    primary: o.domain,
    secondary: `DR ${o.dr}`,
    tail: `${o.overlapPct}%`,
  }))

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Snapshot" dense>
        <KpiRow>
          <KpiTile label="Tracked"  value={fmtNum(s.competitors.length)} />
          <KpiTile label="Our SoV"  value={`${s.ourSov}%`} tone="info" />
          <KpiTile label="Top comp" value={s.competitors[0]?.domain || '—'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Share of voice" dense>
        <BarStack segments={sovSegs} />
      </Section></Card>

      <Card><Section title="Keyword overlap" dense>
        <TopList items={top} max={6} />
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Gaps"   count={s.gaps.length} />
        <DrillChip label="Wins"   count={s.wins.length} />
        <DrillChip label="Losses" count={s.losses.length} />
      </div>
    </div>
  )
}
