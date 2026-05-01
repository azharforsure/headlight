import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import {
  Card, Section, TopList, Sparkline, Distribution, EmptyState,
} from '../_shared'

export function PaidAuction() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Overlap Competitors" dense>
        <TopList 
          items={s.auctions.map((a: any) => ({
            id: a.domain,
            primary: a.domain,
            secondary: `Overlap: ${a.overlap}%`,
            tail: `Pos: ${a.positionAvg}`
          }))}
          placeholder="No auction data found."
        />
      </Section></Card>

      <Card><Section title="Lost Share Trend (12w)" dense>
        <div className="h-[40px] px-1">
          <Sparkline values={[20, 22, 18, 25, 30, 28, 35, 32, 40, 38]} tone="bad" height={40} />
          <div className="text-[10px] text-[#888] mt-1 text-center">Impr. share lost to rank</div>
        </div>
      </Section></Card>

      <Card><Section title="Share Loss Reasons" dense>
        <Distribution rows={[
          { label: 'Lost (Rank)',  value: s.imprShare.lostRank,   tone: 'bad' },
          { label: 'Lost (Budget)', value: s.imprShare.lostBudget, tone: 'warn' },
          { label: 'Won',          value: 100 - s.imprShare.lostRank - s.imprShare.lostBudget, tone: 'good' },
        ]} />
      </Section></Card>
    </div>
  )
}
