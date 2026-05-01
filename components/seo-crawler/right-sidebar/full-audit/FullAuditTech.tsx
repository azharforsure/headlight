import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import {
  Card, Section, MetricRow, BarStack, 
  DrillChip, EmptyState,
  fmtPct, scoreToTone,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditTech() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Technical Health" dense>
          <BarStack segments={[
            { value: s.status.ok,       tone: 'good', label: '2xx' },
            { value: s.status.redirect, tone: 'info', label: '3xx' },
            { value: s.status.client,   tone: 'bad',  label: '4xx' },
            { value: s.status.server,   tone: 'bad',  label: '5xx' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Performance (CWV)" dense>
          <BarStack segments={[
            { value: s.cwv.lcpGood, tone: 'good', label: 'Good' },
            { value: s.cwv.lcpWarn, tone: 'warn', label: 'Needs Improvement' },
            { value: s.cwv.lcpBad,  tone: 'bad',  label: 'Poor' },
          ]} />
          <div className="mt-2 space-y-1">
            <MetricRow label="LCP Pass Rate" value={fmtPct(s.scores.perf)} tone={scoreToTone(s.scores.perf)} />
            <MetricRow label="HTTPS Coverage" value={fmtPct(s.security.httpsPages / s.total * 100)} tone="good" />
          </div>
        </Section>
      </Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Go to Technical Mode" onClick={() => {}} />
      </div>
    </div>
  )
}
