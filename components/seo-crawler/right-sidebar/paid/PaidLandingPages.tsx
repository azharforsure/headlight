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

export function PaidLandingPages() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()
  const drill = useDrill()
  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="LP health" segments={[
        { value: s.lps.healthy, tone: 'good', label: 'Healthy' },
        { value: s.lps.slow, tone: 'warn', label: 'Slow' },
        { value: s.lps.broken, tone: 'bad', label: 'Broken' },
      ]} />
      <DistRowsBlock title="LP issue reasons" rows={[
        { label: 'Slow LCP', value: s.lps.reasons.lcp, tone: 'warn' },
        { label: 'Bad CLS', value: s.lps.reasons.cls, tone: 'warn' },
        { label: '404 / 5xx', value: s.lps.reasons.error, tone: 'bad' },
        { label: 'Mobile-unfriendly', value: s.lps.reasons.mobile, tone: 'warn' },
      ]} />
      <TopListBlock title="Best LPs" items={s.lps.best.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: fmtPct(p.cvr * 100),
        onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Worst LPs" items={s.lps.worst.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: fmtPct(p.cvr * 100),
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By campaign" headers={['Campaign','LPs','Avg CVR','Avg LCP']} rows={s.lps.byCampaign.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.name, values: [c.lps, fmtPct(c.cvr * 100), fmtMs(c.lcp)],
      }))} />
      <DrillFooter chips={[
        { label: 'Broken', count: s.lps.broken }, { label: 'Slow', count: s.lps.slow },
      ]} />
    </div>
  )
}
