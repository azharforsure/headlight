import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, Sparkline, EmptyState, compactNum,
} from '../_shared'

export function PaidSpend() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Efficiency" dense>
        <KpiRow>
          <KpiTile label="Spend" value={'$' + compactNum(s.spend30d)} />
          <KpiTile label="Conversions" value={s.conv30d} tone="good" />
          <KpiTile label="ROAS" value={s.roas.toFixed(1) + 'x'} tone="good" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Spend by Network" dense>
        <Distribution rows={[
          { label: 'Google',  value: Math.round(s.spend30d * 0.45), tone: 'info' },
          { label: 'Meta',    value: Math.round(s.spend30d * 0.35), tone: 'info' },
          { label: 'LinkedIn',value: Math.round(s.spend30d * 0.15), tone: 'info' },
          { label: 'Other',   value: Math.round(s.spend30d * 0.05), tone: 'neutral' },
        ]} />
      </Section></Card>

      <Card><Section title="ROAS Trend (12w)" dense>
        <div className="h-[40px] px-1">
          <Sparkline values={[4.2, 4.5, 4.0, 4.8, 5.2, 5.0, 5.5, 6.0, 5.8, 6.2]} tone="good" height={40} />
        </div>
      </Section></Card>

      <Card><Section title="Top movers (7d)" dense>
        <TopList 
          items={[
            { id: '1', primary: 'Search - NonBrand', secondary: 'Spend +$1.2k', tail: 'Conv +22%', tone: 'good' },
            { id: '2', primary: 'Display - Retargeting', secondary: 'Spend -$400', tail: 'Conv -12%', tone: 'bad' },
          ]}
        />
      </Section></Card>
    </div>
  )
}
