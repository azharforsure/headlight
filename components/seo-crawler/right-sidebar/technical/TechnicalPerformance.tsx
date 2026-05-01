import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineList, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function TechnicalPerformance() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worstLcp = [...pages].filter(p => p.lcpMs).sort((a, b) => Number(b.lcpMs) - Number(a.lcpMs)).slice(0, 6)
  const worstCls = [...pages].filter(p => p.cls != null).sort((a, b) => Number(b.cls) - Number(a.cls)).slice(0, 6)
  const heatCells = useMemo(() => {
    const tpls = [...new Set(pages.map(templateOf))].slice(0, 6)
    const bands = ['good (<2.5s)', 'mid (2.5–4s)', 'poor (>4s)']
    const cells: Array<{ x: string; y: string; value: number }> = []
    for (const t of tpls) for (const band of bands) {
      const n = pages.filter(p => templateOf(p) === t && (
        band.startsWith('good') ? Number(p.lcpMs) < 2500 :
        band.startsWith('mid') ? Number(p.lcpMs) >= 2500 && Number(p.lcpMs) < 4000 :
        Number(p.lcpMs) >= 4000
      )).length
      cells.push({ y: t, x: band, value: n })
    }
    return { cells, xLabels: bands, yLabels: tpls }
  }, [pages])

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="CWV pass mix" segments={[
        { value: s.perf.lcpGood, tone: 'good', label: 'LCP good' },
        { value: s.perf.lcpMid, tone: 'warn', label: 'LCP mid' },
        { value: s.perf.lcpPoor, tone: 'bad', label: 'LCP poor' },
      ]} />
      <DistRowsBlock title="Device mix" rows={[
        { label: 'Mobile good', value: s.perf.mobileGood, tone: 'good' },
        { label: 'Mobile poor', value: s.perf.mobilePoor, tone: 'bad' },
        { label: 'Desktop good', value: s.perf.desktopGood, tone: 'good' },
        { label: 'Desktop poor', value: s.perf.desktopPoor, tone: 'bad' },
      ]} />
      <TrendBlock title="LCP p75 (12 weeks)" values={s.perf.lcpSeries} tone="info" />
      <TopListBlock title="Worst LCP" items={worstLcp.map(p => ({
        id: p.url, primary: p.title || p.url, tail: fmtMs(Number(p.lcpMs)),
        onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Worst CLS" items={worstCls.map(p => ({
        id: p.url, primary: p.title || p.url, tail: Number(p.cls).toFixed(3),
        onClick: () => drill.toPage(p),
      }))} />
      <HeatmapBlock title="Template × LCP band" cells={heatCells.cells} xLabels={heatCells.xLabels} yLabels={heatCells.yLabels} />
      <BenchmarkBar title="LCP vs CrUX 75th pct" site={s.perf.lcpP75} benchmark={s.bench.lcpP75} unit="ms" higherIsBetter={false} />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'LCP p75', a: { v: s.perf.lcpP75, tag: 'now' }, b: { v: s.perf.lcpP75Prev, tag: 'prev' }, format: fmtMs },
        { label: 'CWV pass', a: { v: s.tech.cwvPass, tag: 'now' }, b: { v: s.tech.cwvPassPrev, tag: 'prev' }, format: fmtPct },
      ]} />
      <DrillFooter chips={[
        { label: 'Slow LCP', count: s.perf.lcpPoor },
        { label: 'Bad CLS', count: s.perf.clsBad },
        { label: 'Slow INP', count: s.perf.inpBad },
      ]} />
    </div>
  )
}
