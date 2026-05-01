import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, RingGauge, MetricRow,
  AlertRow, DrillChip, EmptyState, NotConnected, fmtNum,
} from '../_shared'

export function LocalOverview() {
  const s = useLocalInsights()
  const drill = useDrill()

  if (!s.locations.length && !s.gbpProfiles.length) {
    return <NotConnected source="Locations" />
  }

  return (
    <div className="space-y-3 p-3">
      <Card>
        <div className="flex flex-col items-center py-5">
          <RingGauge value={s.score} size={92} label="Local score" />
        </div>
      </Card>

      <Card><Section title="Snapshot" dense>
        <KpiRow>
          <KpiTile label="Locations" value={fmtNum(s.locations.length)} />
          <KpiTile label="GBP verified" value={`${s.gbp.verified}/${s.gbpProfiles.length || 0}`} tone={s.gbp.unverified ? 'warn' : 'good'} />
          <KpiTile label="Avg rating" value={s.rev.avg.toFixed(1)} tone={s.rev.avg >= 4 ? 'good' : 'warn'} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Highlights" dense>
        <MetricRow label="NAP consistent" value={`${s.nap.consistent}/${s.locations.length || 0}`} />
        <MetricRow label="Top-3 local pack" value={`${s.localPack.presencePct}%`} />
        <MetricRow label="Negative reviews 30d" value={s.rev.negative30d} tone={s.rev.negative30d ? 'warn' : 'good'} />
        <MetricRow label="Response rate" value={`${Math.round(s.rev.responseRate * 100)}%`} />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        {s.gbp.unverified > 0 && (
          <AlertRow alert={{ id: 'g', tone: 'warn', title: 'Unverified GBP profiles', count: s.gbp.unverified }} />
        )}
        {s.nap.mismatch > 0 && (
          <AlertRow alert={{ id: 'n', tone: 'warn', title: 'NAP mismatches', count: s.nap.mismatch }} />
        )}
        {s.rev.negative30d > 0 && (
          <AlertRow alert={{ id: 'r', tone: 'bad', title: 'Negative reviews this month', count: s.rev.negative30d }} />
        )}
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="NAP"        count={s.nap.mismatch} />
        <DrillChip label="GBP"        count={s.gbp.unverified} />
        <DrillChip label="Reviews"    count={s.rev.negative30d} />
        <DrillChip label="Local pack" />
      </div>
    </div>
  )
}
