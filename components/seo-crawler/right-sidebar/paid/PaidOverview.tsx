import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import {
  Card, Section, KpiRow, KpiTile, MetricRow, AlertRow, DrillChip, EmptyState, NotConnected, compactNum,
} from '../_shared'

export function PaidOverview() {
  const { paidCampaigns, setSettingsTab } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) {
    return <NotConnected source="Ad accounts" onConnect={() => setSettingsTab('integrations')} />
  }

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Paid performance" dense>
        <KpiRow>
          <KpiTile label="Spend (30d)" value={'$' + compactNum(s.spend30d)} />
          <KpiTile label="Avg CPA" value={'$' + s.cpa.toFixed(0)} tone="info" />
          <KpiTile label="Avg ROAS" value={s.roas.toFixed(1) + 'x'} tone="good" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Campaign health quadrant" dense>
        <MetricRow label="Scale (High Spend / High Conv)" value={s.total > 0 ? '2 camps' : '0'} tone="good" />
        <MetricRow label="Stars (Low Spend / High Conv)"  value={s.total > 0 ? '1 camp' : '0'} tone="info" />
        <MetricRow label="Fix (High Spend / Low Conv)"   value={s.total > 0 ? '3 camps' : '0'} tone="bad" />
        <MetricRow label="Cut (Low Spend / Low Conv)"    value={s.total > 0 ? '5 camps' : '0'} tone="neutral" />
      </Section></Card>

      <Card><Section title="Top Alerts" dense>
        <AlertRow alert={{ id: 'b', tone: 'warn', title: '2 campaigns limited by budget' }} />
        <AlertRow alert={{ id: 'l', tone: 'info', title: '1 campaign in learning mode' }} />
        <AlertRow alert={{ id: 'f', tone: 'warn', title: 'Creative fatigue detected on "Brand" ad' }} />
        <AlertRow alert={{ id: 'd', tone: 'bad', title: '1 ad disapproval found' }} />
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Spend" count={'$' + compactNum(s.spend30d)} />
        <DrillChip label="Quality" />
        <DrillChip label="Auctions" />
      </div>
    </div>
  )
}
