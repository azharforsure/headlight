import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import {
  Card, Section, KpiTile, KpiRow, Distribution,
  Sparkline, TopList, EmptyState,
  compactNum,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function WqaSearch() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Search KPI" dense>
          <KpiRow>
            <KpiTile label="Clicks" value={compactNum(s.clicks)} tone="good" />
            <KpiTile label="Impr" value={compactNum(s.impr)} tone="info" />
            <KpiTile label="Avg Pos" value={s.avgPos.toFixed(1)} />
          </KpiRow>
          <div className="mt-2 h-[40px] px-1">
            <Sparkline values={s.trend} height={40} tone="good" />
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Position Distribution" dense>
          <Distribution rows={[
            { label: 'Top 3',    value: s.rankBuckets.top3, tone: 'good' },
            { label: 'Top 10',   value: s.rankBuckets.top10, tone: 'info' },
            { label: 'Striking', value: s.rankBuckets.striking, tone: 'warn' },
            { label: 'Tail',     value: s.rankBuckets.tail, tone: 'neutral' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Top Winners" dense>
          <TopList 
            items={s.winners.map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `▲ ${Number(p.gscClicks - (p.prevClicks || 0)).toFixed(0)}`,
              onClick: () => drill.toPage(p)
            }))}
          />
        </Section>
      </Card>
    </div>
  )
}
