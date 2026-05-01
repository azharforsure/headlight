import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import {
  Card, Section, KpiTile, KpiRow, Distribution,
  TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function ContentQuality() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Quality KPIs" dense>
          <KpiRow>
            <KpiTile label="Readability" value="High" tone="good" />
            <KpiTile label="% Byline" value={fmtPct(s.eeat.withByline)} tone="info" />
            <KpiTile label="Citations" value={fmtPct(s.eeat.cited)} tone="info" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="E-E-A-T Signals" dense>
          <Distribution rows={[
            { label: 'With Byline', value: Math.round(s.total * s.eeat.withByline / 100), tone: 'info' },
            { label: 'With Bio',    value: Math.round(s.total * s.eeat.withBio / 100),    tone: 'info' },
            { label: 'Cited',       value: Math.round(s.total * s.eeat.cited / 100),       tone: 'info' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Alerts" dense>
          {s.eeat.withBio < 50 && (
            <AlertRow alert={{ id: 'b', tone: 'warn', title: 'Missing author bios on 50%+ pages' }} />
          )}
        </Section>
      </Card>
    </div>
  )
}

function fmtPct(n: number) { return `${Math.round(n)}%` }
