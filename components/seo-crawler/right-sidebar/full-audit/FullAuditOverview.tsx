import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiTile, KpiRow, MetricRow, BarStack, 
  RingGauge, AlertRow, EmptyState,
  fmtNum, fmtPct, scoreToTone, compactNum,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditOverview() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) {
    return <EmptyState title="No crawl data yet" hint="Start a crawl to see this tab." />
  }

  return (
    <div className="space-y-3 p-3">
      {/* HERO */}
      <Card>
        <Section title="Snapshot" dense>
          <div className="flex items-center gap-4 py-1">
            <RingGauge value={s.score} label="Score" size={80} />
            <div className="flex-1">
              <KpiRow>
                <KpiTile label="Pages" value={compactNum(s.total)} />
                <KpiTile label="HTTPS" value={fmtPct(s.tech.httpsCoverage)} tone={scoreToTone(s.tech.httpsCoverage)} />
                <KpiTile label="Indexable" value={fmtPct(s.tech.indexable)} tone={scoreToTone(s.tech.indexable)} />
              </KpiRow>
            </div>
          </div>
        </Section>
      </Card>

      {/* STATUS MIX */}
      <Card>
        <Section title="Status Mix" dense>
          <BarStack segments={[
            { value: s.issues.errors, tone: 'bad', label: 'Errors' },
            { value: s.issues.warnings, tone: 'warn', label: 'Warnings' },
            { value: s.issues.notices, tone: 'info', label: 'Notices' },
            { value: s.total - (s.issues.errors + s.issues.warnings + s.issues.notices), tone: 'good', label: 'Healthy' }
          ]} />
        </Section>
      </Card>

      {/* BREAKDOWN */}
      <Card>
        <Section title="Pillar Scores" dense>
          <MetricRow label="Technical" value={s.tech.cwvPass + '%'} tone={scoreToTone(s.tech.cwvPass)} />
          <MetricRow label="Content" value={fmtPct(s.tech.indexable)} tone={scoreToTone(s.tech.indexable)} />
          <MetricRow label="Links" value={s.links.refDomains} tone="info" />
          <MetricRow label="Search" value={compactNum(s.search.clicksTotal)} tone="good" />
          <MetricRow label="AI" value={s.ai.llmsTxt ? 'Present' : 'Missing'} tone={s.ai.llmsTxt ? 'good' : 'warn'} />
        </Section>
      </Card>

      {/* ALERTS */}
      <Card>
        <Section title="Top Alerts" dense>
          {s.issues.errors > 0 && (
            <AlertRow alert={{ id: 'e', tone: 'bad', title: 'Critical errors found', count: s.issues.errors }} 
                      onClick={() => drill.toCategory('status', 'All Errors')} />
          )}
          {s.links.broken > 0 && (
            <AlertRow alert={{ id: 'b', tone: 'bad', title: 'Broken internal links', count: s.links.broken }} 
                      onClick={() => drill.toCategory('links', 'Broken Links')} />
          )}
          {s.issues.warnings > 0 && (
            <AlertRow alert={{ id: 'w', tone: 'warn', title: 'Warnings to review', count: s.issues.warnings }} 
                      onClick={() => drill.toCategory('indexability', 'All Warnings')} />
          )}
          {s.tech.cwvPass < 50 && (
            <AlertRow alert={{ id: 'p', tone: 'warn', title: 'Poor Core Web Vitals coverage' }} 
                      onClick={() => drill.toCategory('performance', 'Core Web Vitals')} />
          )}
        </Section>
      </Card>
    </div>
  )
}

