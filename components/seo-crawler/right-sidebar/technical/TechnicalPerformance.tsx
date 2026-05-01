import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, Distribution,
  TopList, AlertRow, EmptyState,
  fmtMs, fmtPct, scoreToTone,
} from '../_shared'

export function TechnicalPerformance() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Performance Overview" dense>
        <KpiRow>
          <KpiTile label="Avg LCP" value="2.4s" tone="good" />
          <KpiTile label="Avg TTFB" value="240ms" tone="good" />
          <KpiTile label="CWV Pass" value={fmtPct(s.scores.perf)} tone={scoreToTone(s.scores.perf)} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="LCP Distribution" dense>
        <Distribution rows={[
          { label: 'Good (<2.5s)', value: s.cwv.lcpGood, tone: 'good' },
          { label: 'Needs Impr',  value: s.cwv.lcpWarn, tone: 'warn' },
          { label: 'Poor (>4s)',   value: s.cwv.lcpBad,  tone: 'bad' },
        ]} />
      </Section></Card>

      <Card><Section title="Slowest Pages (LCP)" dense>
        <TopList items={pages
          .filter(p => Number(p.lcp) > 0)
          .sort((a, b) => Number(b.lcp) - Number(a.lcp))
          .slice(0, 5)
          .map(p => ({
            id: p.url,
            primary: p.title || p.url,
            tail: `${(Number(p.lcp) / 1000).toFixed(1)}s`,
            onClick: () => drill.toPage(p)
          }))} />
      </Section></Card>
    </div>
  )
}

