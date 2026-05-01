import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, RingGauge, MetricRow,
  AlertRow, DrillChip, EmptyState, fmtNum,
} from '../_shared'

export function AiOverview() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <div className="flex flex-col items-center py-5">
          <RingGauge value={s.score} size={92} label="AI-readiness" />
        </div>
      </Card>

      <Card><Section title="Snapshot" dense>
        <KpiRow>
          <KpiTile label="Bots blocked"  value={fmtNum(s.blockedBotsCount)} tone={s.blockedBotsCount ? 'warn' : 'good'} />
          <KpiTile label="llms.txt"      value={s.llmsTxt.hasLlmsTxt ? 'Yes' : 'No'} tone={s.llmsTxt.hasLlmsTxt ? 'good' : 'warn'} />
          <KpiTile label="Citations"     value={fmtNum(s.citations.total)} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Extractability" dense>
        <MetricRow label="Avg fitness"   value={(s.extractability.avgScore * 100).toFixed(0)} tone={s.extractability.avgScore >= 0.6 ? 'good' : 'warn'} />
        <MetricRow label="Answerable"    value={`${s.extractability.answerable}%`} />
        <MetricRow label="FAQ schema"    value={`${s.extractability.hasFaq}%`} />
        <MetricRow label="HowTo schema"  value={`${s.extractability.hasHowto}%`} />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        {!s.llmsTxt.hasLlmsTxt && (
          <AlertRow alert={{ id: 'l', tone: 'warn', title: 'No llms.txt at site root' }} />
        )}
        {s.blockedBotsCount > 0 && (
          <AlertRow alert={{ id: 'b', tone: 'warn', title: 'AI bots blocked', count: s.blockedBotsCount }} />
        )}
        {s.entities.hasOrg < 50 && (
          <AlertRow alert={{ id: 'e', tone: 'warn', title: 'Weak Organization schema coverage' }} />
        )}
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Crawlability" />
        <DrillChip label="Citations"    count={s.citations.total} />
        <DrillChip label="Schema"       />
      </div>
    </div>
  )
}
