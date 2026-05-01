import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiTile, KpiRow,
  Distribution, TopList, Sparkline, EmptyState,
  fmtNum, compactNum,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditSearch() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Search Performance" dense>
          <KpiRow>
            <KpiTile label="Clicks" value={compactNum(s.search.clicksTotal)} tone="good" />
            <KpiTile label="Impressions" value={compactNum(s.search.imprTotal)} tone="info" />
            <KpiTile label="Avg Pos" value={s.search.avgPos.toFixed(1)} />
          </KpiRow>
          <div className="mt-2 h-[40px] px-1">
            <Sparkline values={[40, 45, 42, 48, 52, 50, 55, 60, 58, 62]} tone="good" height={40} />
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Position Distribution" dense>
          <Distribution rows={[
            { label: 'Top 3',    value: pages.filter(p => Number(p.gscPosition) > 0 && Number(p.gscPosition) <= 3).length, tone: 'good' },
            { label: 'Page 1',   value: pages.filter(p => Number(p.gscPosition) > 3 && Number(p.gscPosition) <= 10).length, tone: 'info' },
            { label: 'Striking', value: pages.filter(p => Number(p.gscPosition) > 10 && Number(p.gscPosition) <= 20).length, tone: 'warn' },
            { label: 'Beyond',   value: pages.filter(p => Number(p.gscPosition) > 20).length, tone: 'neutral' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Top Winners" dense>
          <TopList 
            items={pages
              .filter(p => Number(p.sessionsDeltaPct) > 10)
              .sort((a, b) => Number(b.sessionsDeltaPct) - Number(a.sessionsDeltaPct))
              .slice(0, 5)
              .map(p => ({
                id: p.url,
                primary: p.title || p.url,
                tail: `+${Number(p.sessionsDeltaPct).toFixed(1)}%`,
                onClick: () => drill.toPage(p)
              }))}
          />
        </Section>
      </Card>
    </div>
  )
}
