import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function PaidAuction() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()
  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistRowsBlock title="Lost share reasons" rows={[
        { label: 'Lost — budget', value: fmtPct(s.auction.lostBudget * 100), tone: 'warn' },
        { label: 'Lost — rank', value: fmtPct(s.auction.lostRank * 100), tone: 'warn' },
        { label: 'Eligible', value: fmtPct((1 - s.auction.lostBudget - s.auction.lostRank) * 100), tone: 'info' },
      ]} />
      <DistBlock title="Position mix" segments={[
        { value: s.auction.posTop, tone: 'good', label: 'Top' },
        { value: s.auction.posOther, tone: 'info', label: 'Other' },
        { value: s.auction.posAbsolute, tone: 'good', label: 'Absolute top' },
      ]} />
      <TrendBlock title="Impression share (90d)" values={s.auction.isSeries} tone="info" />
      <TopListBlock title="Competitors in auction" items={s.auction.competitors.slice(0, 6).map((c: any) => ({
        id: c.domain, primary: c.domain, tail: fmtPct(c.overlapRate * 100),
      }))} />
      <SegmentBlock title="By campaign" headers={['Campaign','IS','Lost budget','Lost rank']} rows={s.auction.byCampaign.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.name, values: [fmtPct(c.is * 100), fmtPct(c.lostBudget * 100), fmtPct(c.lostRank * 100)],
      }))} />
      <BenchmarkBlock title="Auction overlap" site={s.auction.avgOverlap * 100} benchmark={s.bench.auctionOverlap * 100} unit="%" higherIsBetter={false} />
      <DrillFooter chips={[
        { label: 'Lost budget', count: fmtPct(s.auction.lostBudget * 100) },
        { label: 'Lost rank', count: fmtPct(s.auction.lostRank * 100) },
      ]} />
    </div>
  )
}
