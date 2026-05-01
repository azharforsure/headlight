import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import {
  Card, Section, KpiTile, KpiRow, BarStack, 
  RingGauge, EmptyState, MetricRow,
  fmtNum, fmtPct, scoreToTone,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function TechnicalOverview() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      {/* HERO */}
      <Card>
        <Section title="Technical Health" dense>
          <div className="flex items-center gap-4 py-1">
            <RingGauge value={s.scores.overall} label="Health" size={80} />
            <div className="flex-1">
              <KpiRow>
                <KpiTile label="Pages" value={fmtNum(s.total)} />
                <KpiTile label="2xx OK" value={fmtPct(s.status.ok / s.total * 100)} tone="good" />
                <KpiTile label="Crawlable" value={fmtPct((s.total - s.status.blocked) / s.total * 100)} />
              </KpiRow>
            </div>
          </div>
        </Section>
      </Card>

      {/* STATUS MIX */}
      <Card>
        <Section title="Status Distribution" dense>
          <BarStack segments={[
            { value: s.status.ok,       tone: 'good', label: '2xx' },
            { value: s.status.redirect, tone: 'info', label: '3xx' },
            { value: s.status.client,   tone: 'bad',  label: '4xx' },
            { value: s.status.server,   tone: 'bad',  label: '5xx' },
          ]} />
        </Section>
      </Card>

      {/* PILLAR SCORES */}
      <Card>
        <Section title="Pillar Breakdown" dense>
          <MetricRow label="Crawl Efficiency" value={fmtPct(s.scores.crawl)} tone={scoreToTone(s.scores.crawl)} />
          <MetricRow label="Indexing" value={fmtPct(s.scores.index)} tone={scoreToTone(s.scores.index)} />
          <MetricRow label="Rendering" value={fmtPct(s.scores.render)} tone={scoreToTone(s.scores.render)} />
          <MetricRow label="Performance" value={fmtPct(s.scores.perf)} tone={scoreToTone(s.scores.perf)} />
          <MetricRow label="Security" value={fmtPct(s.scores.security)} tone={scoreToTone(s.scores.security)} />
        </Section>
      </Card>
    </div>
  )
}
