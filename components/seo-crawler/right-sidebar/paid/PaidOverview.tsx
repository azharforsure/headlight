import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function PaidOverview() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()
  const drill = useDrill()
  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" hint="Connect Google Ads / Meta Ads." />

  const top = [...paidCampaigns].sort((a, b) => Number(b.spend) - Number(a.spend)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Paid"
        scoreHint="Spend health, quality score, auction, LP"
        kpis={[
          { label: 'Spend (30d)', value: fmtCurrency(s.spend30d) },
          { label: 'CPA', value: fmtCurrency(s.cpa), tone: scoreToTone(100 - Math.min(100, s.cpa / Math.max(1, s.bench.cpa) * 50)) },
          { label: 'ROAS', value: s.roas.toFixed(1) + 'x', tone: scoreToTone(s.roas * 25) },
        ]} />
      <DistBlock title="Channel mix" segments={[
        { value: s.byChannel.search, tone: 'good', label: 'Search' },
        { value: s.byChannel.display, tone: 'info', label: 'Display' },
        { value: s.byChannel.video, tone: 'info', label: 'Video' },
        { value: s.byChannel.shopping, tone: 'good', label: 'Shopping' },
        { value: s.byChannel.social, tone: 'info', label: 'Social' },
      ]} />
      <DistRowsBlock title="Performance bands" rows={[
        { label: 'Winning campaigns', value: s.bands.winning, tone: 'good' },
        { label: 'Steady', value: s.bands.steady, tone: 'info' },
        { label: 'At risk', value: s.bands.atRisk, tone: 'warn' },
        { label: 'Losing', value: s.bands.losing, tone: 'bad' },
      ]} />
      <TrendBlock title="Spend (30d)" values={s.spendSeries} tone="info" />
      <TopListBlock title="Top campaigns by spend" items={top.map(c => ({
        id: c.id, primary: c.name, secondary: `${c.channel} · ${c.objective}`,
        tail: fmtCurrency(Number(c.spend)),
      }))} />
      <SegmentBlock title="By campaign type" headers={['Type','Spend','CPA','ROAS']} rows={s.byType.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [fmtCurrency(t.spend), fmtCurrency(t.cpa), `${t.roas.toFixed(1)}x`],
      }))} />
      <BenchmarkBlock title="CPA vs vertical median" site={s.cpa} benchmark={s.bench.cpa} unit="$" higherIsBetter={false} />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Spend', a: { v: s.spend30d, tag: 'now' }, b: { v: s.spendPrev, tag: 'prev' }, format: fmtCurrency },
        { label: 'CPA', a: { v: s.cpa, tag: 'now' }, b: { v: s.cpaPrev, tag: 'prev' }, format: fmtCurrency },
        { label: 'ROAS', a: { v: s.roas, tag: 'now' }, b: { v: s.roasPrev, tag: 'prev' }, format: v => `${v.toFixed(1)}x` },
      ]} />

      <DrillFooter chips={[
        { label: 'Spend', count: fmtCurrency(s.spend30d) },
        { label: 'QS', count: s.avgQs.toFixed(1) },
        { label: 'Auction', count: fmtPct(s.auction.impressionShare * 100) },
        { label: 'LPs', count: s.lps.total },
      ]} />
    </div>
  )
}
