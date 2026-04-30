import React from 'react'
import { Card, Row, Sparkline, Bar, SourceChip, fmtCurrency } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { PaidStats } from '@/services/right-sidebar/paid'

export function PaidSpendTab({ stats }: RsTabProps<PaidStats>) {
  if (stats.source === 'none') return <RsPartial title="No ads connector" reason="Connect Google Ads or Meta Ads." />
  const s = stats.spend
  const SRC = { tier: 'authoritative', name: stats.source } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Spend" right={<SourceChip source={SRC} />}>
        <Row label="Last 7d"     value={fmtCurrency(s.last7dSpend ?? 0)} />
        <Row label="Last 30d"     value={fmtCurrency(s.last30dSpend ?? 0)} />
        <Row label="Projected mo." value={fmtCurrency(s.projectedMonthSpend ?? 0)} />
        <Row label="CPA"          value={s.cpa != null ? fmtCurrency(s.cpa) : '—'} />
        <Row label="ROAS"         value={s.roas != null ? `${s.roas.toFixed(2)}x` : '—'} />
        {s.dailyTrend.length > 1 && <div className="mt-1"><Sparkline data={s.dailyTrend} width={220} height={32} /></div>}
      </Card>
      {s.spendByCampaign.length > 0 && (
        <Card title="By campaign">
          <Bar data={s.spendByCampaign.slice(0, 6).map(c => ({ label: c.campaign.slice(0, 10), value: c.spend }))} />
        </Card>
      )}
    </div>
  )
}
