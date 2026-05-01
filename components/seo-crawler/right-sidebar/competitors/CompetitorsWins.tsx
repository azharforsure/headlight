import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import {
  Card, Section, KpiRow, KpiTile, TopList, Sparkline, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function CompetitorsWins() {
  const { pages } = useSeoCrawler()
  const s = useCompetitorsInsights()
  const drill = useDrill()

  if (!s.competitors.length) return <EmptyState title="No competitors tracked" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Winning summary" dense>
        <KpiRow>
          <KpiTile label="Keywords owned" value={s.wins.length} tone="good" />
          <KpiTile label="Top-3 wins"     value="24" tone="good" />
          <KpiTile label="Sitelinks"      value="12" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Trend (12w)" dense>
        <div className="h-[40px] px-1">
          <Sparkline values={[150, 155, 162, 160, 168, 175, 180, 185, 192, 190]} tone="good" height={40} />
        </div>
      </Section></Card>

      <Card><Section title="Top competitive wins" dense>
        <TopList 
          items={s.wins.slice(0, 8).map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: `Outranked: ${p.outrankedCompetitors?.join(', ')}`,
            tail: `Pos: ${p.position}`,
            onClick: () => drill.toPage(p)
          }))}
        />
      </Section></Card>
    </div>
  )
}
