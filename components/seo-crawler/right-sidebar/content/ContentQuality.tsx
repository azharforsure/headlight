import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineList, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function ContentQuality() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worst = [...pages].sort((a, b) => Number(a.qualityScore) - Number(b.qualityScore)).slice(0, 6)
  const heatCells = useMemo(() => {
    const tpls = [...new Set(pages.map(templateOf))].slice(0, 6)
    const bands = ['Critical','Poor','Fair','Good','Excellent']
    const cells: Array<{ x: string; y: string; value: number }> = []
    for (const t of tpls) for (const b of bands) {
      const n = pages.filter(p => templateOf(p) === t && qualityBand(Number(p.qualityScore)) === b).length
      cells.push({ y: t, x: b, value: n })
    }
    return { cells, xLabels: bands, yLabels: tpls }
  }, [pages])

  return (
    <div className="space-y-3 p-3">
      <DistRowsBlock title="Thin reasons" rows={[
        { label: '<150 words', value: s.reasons.tinyWord, tone: 'bad' },
        { label: '150–300 words', value: s.reasons.shortWord, tone: 'warn' },
        { label: 'No H1', value: s.reasons.noH1, tone: 'warn' },
        { label: 'Boilerplate', value: s.reasons.boilerplate, tone: 'warn' },
        { label: 'Auto-generated feel', value: s.reasons.aiy, tone: 'warn' },
      ]} />
      <DistBlock title="Quality band" segments={[
        { value: s.bands.excellent, tone: 'good', label: 'Excellent' },
        { value: s.bands.good, tone: 'good', label: 'Good' },
        { value: s.bands.fair, tone: 'info', label: 'Fair' },
        { value: s.bands.poor, tone: 'warn', label: 'Poor' },
        { value: s.bands.critical, tone: 'bad', label: 'Critical' },
      ]} />
      <TopListBlock title="Worst quality pages" items={worst.map(p => ({
        id: p.url, primary: p.title || p.url, tail: Number(p.qualityScore).toFixed(0),
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template','Pages','Avg q','Thin']} rows={s.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, t.avgQuality.toFixed(0), t.thin],
      }))} />
      <HeatmapBlock title="Template × band" cells={heatCells.cells} xLabels={heatCells.xLabels} yLabels={heatCells.yLabels} />
      <DrillFooter chips={[
        { label: 'Thin', count: s.thin }, { label: 'Dup', count: s.dup.exact + s.dup.near }, { label: 'AI-y', count: s.aiy },
      ]} />
    </div>
  )
}

function qualityBand(v: number): string {
  if (v >= 90) return 'Excellent'; if (v >= 75) return 'Good'
  if (v >= 60) return 'Fair';      if (v >= 40) return 'Poor'
  return 'Critical'
}
