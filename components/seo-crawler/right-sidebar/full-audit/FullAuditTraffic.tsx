import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function FullAuditTraffic() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()
  const heatCells = useMemo(() => {
    if (!pages?.length) return { cells: [], xLabels: [], yLabels: [] }
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    const hours = ['0','3','6','9','12','15','18','21']
    const cells: Array<{ x: string; y: string; value: number }> = []
    for (const d of days) for (const h of hours) {
      cells.push({ x: h, y: d, value: s.traffic.heatmap?.[`${d}::${h}`] || 0 })
    }
    return { cells, xLabels: hours, yLabels: days }
  }, [s])

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topTraffic = [...pages].sort((a, b) => Number(b.sessions) - Number(a.sessions)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Channel mix" segments={[
        { value: s.traffic.organic,   tone: 'good', label: 'Organic' },
        { value: s.traffic.direct,    tone: 'info', label: 'Direct' },
        { value: s.traffic.referral,  tone: 'info', label: 'Referral' },
        { value: s.traffic.social,    tone: 'info', label: 'Social' },
        { value: s.traffic.paid,      tone: 'warn', label: 'Paid' },
      ]} />
      <DistRowsBlock title="Device mix" rows={[
        { label: 'Mobile', value: s.traffic.mobile, tone: 'info' },
        { label: 'Desktop', value: s.traffic.desktop, tone: 'info' },
        { label: 'Tablet', value: s.traffic.tablet, tone: 'neutral' },
      ]} />
      <TrendBlock title="Sessions (30d)" values={s.traffic.sessionsSeries} tone="info" />
      <TopListBlock title="Top traffic pages" items={topTraffic.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: compactNum(Number(p.sessions)), onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By source / medium" headers={['Source', 'Sessions', 'Conv', 'Bounce']} rows={s.traffic.sourceMix.slice(0, 6).map((m: any) => ({
        id: m.source, label: m.source, values: [compactNum(m.sessions), m.conversions, fmtPct(m.bounce * 100)],
      }))} />
      <HeatmapBlock title="Hour × day" cells={heatCells.cells} xLabels={heatCells.xLabels} yLabels={heatCells.yLabels} />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Sessions', a: { v: s.traffic.sessions, tag: 'now' }, b: { v: s.traffic.sessionsPrev, tag: 'prev' }, format: compactNum },
        { label: 'Bounce',   a: { v: s.traffic.bounceRate * 100, tag: 'now' }, b: { v: s.traffic.bounceRatePrev * 100, tag: 'prev' }, format: v => fmtPct(v) },
      ]} />

      <DrillFooter chips={[
        { label: 'Organic', count: compactNum(s.traffic.organic) },
        { label: 'Paid',    count: compactNum(s.traffic.paid) },
        { label: 'Social',  count: compactNum(s.traffic.social) },
      ]} />
    </div>
  )
}
