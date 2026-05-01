import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket } from '../_shared/derive'

export function UxCwv() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worstLcp = [...pages].filter(p => p.lcpMs).sort((a, b) => Number(b.lcpMs) - Number(a.lcpMs)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="LCP band" segments={[
        { value: s.cwv.lcpGood, tone: 'good', label: 'Good' },
        { value: s.cwv.lcpMid, tone: 'warn', label: 'Mid' },
        { value: s.cwv.lcpPoor, tone: 'bad', label: 'Poor' },
      ]} />
      <DistRowsBlock title="Device mix" rows={[
        { label: 'Mobile pass', value: s.cwv.mobilePass, tone: 'good' },
        { label: 'Mobile fail', value: s.cwv.mobileFail, tone: 'bad' },
        { label: 'Desktop pass', value: s.cwv.desktopPass, tone: 'good' },
        { label: 'Desktop fail', value: s.cwv.desktopFail, tone: 'bad' },
      ]} />
      <TrendBlock title="LCP p75 (12 weeks)" values={s.cwv.lcpSeries} tone="info" />
      <TopListBlock title="Worst LCP pages" items={worstLcp.map(p => ({
        id: p.url, primary: p.title || p.url, tail: fmtMs(Number(p.lcpMs)),
        onClick: () => drill.toPage(p),
      }))} />
      <BenchmarkBlock title="vs CrUX 75th pct" site={s.cwv.lcpP75} benchmark={s.bench.lcpP75} unit="ms" higherIsBetter={false} />
      <DrillFooter chips={[
        { label: 'Slow LCP', count: s.cwv.lcpPoor },
        { label: 'Bad CLS', count: s.cwv.clsBad },
      ]} />
    </div>
  )
}
