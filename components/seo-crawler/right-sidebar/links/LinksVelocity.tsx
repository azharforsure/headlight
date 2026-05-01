import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import {
  Card, Section, KpiTile, Sparkline, TopList, EmptyState, fmtNum,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function LinksVelocity() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="New RD (30d)" value={fmtNum(s.velocity.newRefDomains)} tone="good" />
        <KpiTile label="Lost RD (30d)" value={fmtNum(s.velocity.lostRefDomains)} tone="bad" />
        <KpiTile label="New BL (30d)" value={fmtNum(s.velocity.newBacklinks)} tone="good" />
        <KpiTile label="Lost BL (30d)" value={fmtNum(s.velocity.lostBacklinks)} tone="bad" />
      </div>

      <Card><Section title="Weekly RD Trend" dense>
        <div className="h-[40px] px-1">
          <Sparkline values={[840, 845, 852, 848, 860, 865, 872, 870]} tone="good" height={40} />
        </div>
      </Section></Card>

      <Card><Section title="Top Gainers" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.newRefDomains30d) > 0)
            .sort((a, b) => Number(b.newRefDomains30d) - Number(a.newRefDomains30d))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `+${p.newRefDomains30d}`,
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>

      <Card><Section title="Top Losers" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.lostRefDomains30d) > 0)
            .sort((a, b) => Number(b.lostRefDomains30d) - Number(a.lostRefDomains30d))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `-${p.lostRefDomains30d}`,
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>
    </div>
  )
}
