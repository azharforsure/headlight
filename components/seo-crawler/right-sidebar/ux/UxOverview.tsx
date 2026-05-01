import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import {
  Card, Section, KpiRow, KpiTile, RingGauge, MetricRow, AlertRow, EmptyState, fmtNum, fmtPct, compactNum,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function UxOverview() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <div className="flex flex-col items-center py-5">
          <RingGauge value={s.passingPct} size={92} label="CWV Pass" />
        </div>
      </Card>

      <Card><Section title="Conversion summary" dense>
        <KpiRow>
          <KpiTile label="Site CvR"   value={s.conv.cvr.toFixed(2) + '%'} tone="good" />
          <KpiTile label="Sessions"   value={compactNum(s.conv.sessions)} />
          <KpiTile label="Revenue"    value={'$' + compactNum(s.conv.revenue)} tone="good" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Friction signals" dense>
        <MetricRow label="Rage Clicks"  value={s.friction.rage}  tone={s.friction.rage > 0 ? 'bad' : 'neutral'} />
        <MetricRow label="Dead Clicks"  value={s.friction.dead}  tone={s.friction.dead > 0 ? 'warn' : 'neutral'} />
        <MetricRow label="U-Turns"      value={s.friction.uTurn} tone={s.friction.uTurn > 0 ? 'info' : 'neutral'} />
        <MetricRow label="Form Abandon" value={s.friction.formAbandon} tone="bad" />
      </Section></Card>

      <Card><Section title="Top Alerts" dense>
        {s.friction.rage > 10 && (
          <AlertRow alert={{ id: 'r', tone: 'bad', title: 'High rage click volume detected' }} />
        )}
        {s.cwv.lcpBad > 0 && (
          <AlertRow alert={{ id: 'l', tone: 'bad', title: 'Critical LCP failures', count: s.cwv.lcpBad }} 
                    onClick={() => drill.toCategory('performance', 'Core Web Vitals')} />
        )}
      </Section></Card>
    </div>
  )
}
