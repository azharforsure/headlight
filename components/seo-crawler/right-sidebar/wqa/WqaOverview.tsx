import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import {
  Card, Section, KpiTile, KpiRow, BarStack, Distribution,
  RingGauge, AlertRow, EmptyState,
  fmtNum, fmtPct, scoreToTone,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function WqaOverview() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      {/* HERO */}
      <Card>
        <Section title="Site Quality" dense>
          <div className="flex items-center gap-4 py-1">
            <RingGauge value={s.qOverall} label="Quality" size={80} />
            <div className="flex-1">
              <KpiRow>
                <KpiTile label="Pages" value={fmtNum(s.total)} />
                <KpiTile label="Indexable" value={fmtPct(s.indexable / s.total * 100)} />
                <KpiTile label="Avg LCP" value={s.cwv.lcpGood > 0 ? '2.4s' : '—'} />
              </KpiRow>
            </div>
          </div>
        </Section>
      </Card>

      {/* CATEGORY MIX */}
      <Card>
        <Section title="Category Mix" dense>
          <BarStack segments={Object.entries(s.categories).slice(0, 5).map(([label, value]) => ({
            value, label, tone: 'info'
          }))} />
        </Section>
      </Card>

      {/* QUALITY DISTRIBUTION */}
      <Card>
        <Section title="Quality Distribution" dense>
          <Distribution rows={[
            { label: 'High Quality', value: s.quality.high, tone: 'good' },
            { label: 'Medium',       value: s.quality.med,  tone: 'warn' },
            { label: 'Low Quality',  value: s.quality.low,  tone: 'bad' },
          ]} />
        </Section>
      </Card>

      {/* ALERTS */}
      <Card>
        <Section title="Top Alerts" dense>
          {s.alerts.slice(0, 3).map((a, i) => (
            <AlertRow key={i} alert={{ id: String(i), tone: a.tone, title: a.text }} />
          ))}
        </Section>
      </Card>
    </div>
  )
}
