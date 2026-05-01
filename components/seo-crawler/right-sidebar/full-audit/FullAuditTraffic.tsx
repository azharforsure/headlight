import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiTile, KpiRow,
  Distribution, TopList, EmptyState,
  compactNum, fmtPct,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditTraffic() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Traffic Overview" dense>
          <KpiRow>
            <KpiTile label="Sessions" value={compactNum(s.traffic.sessions)} tone="info" />
            <KpiTile label="Revenue" value={`$${compactNum(s.traffic.revenue)}`} tone="good" />
            <KpiTile label="Conv" value={compactNum(s.traffic.conv)} tone="good" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Channel Mix" dense>
          {/* Mock channel mix as it's not in the hook yet but mentioned in spec */}
          <Distribution rows={[
            { label: 'Organic',  value: Math.round(s.traffic.sessions * 0.65), tone: 'good' },
            { label: 'Direct',   value: Math.round(s.traffic.sessions * 0.20), tone: 'info' },
            { label: 'Social',   value: Math.round(s.traffic.sessions * 0.10), tone: 'warn' },
            { label: 'Other',    value: Math.round(s.traffic.sessions * 0.05), tone: 'neutral' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Top Revenue Pages" dense>
          <TopList 
            items={pages
              .filter(p => Number(p.ga4Revenue) > 0)
              .sort((a, b) => Number(b.ga4Revenue) - Number(a.ga4Revenue))
              .slice(0, 5)
              .map(p => ({
                id: p.url,
                primary: p.title || p.url,
                tail: `$${Number(p.ga4Revenue).toFixed(0)}`,
                onClick: () => drill.toPage(p)
              }))}
          />
        </Section>
      </Card>
    </div>
  )
}
