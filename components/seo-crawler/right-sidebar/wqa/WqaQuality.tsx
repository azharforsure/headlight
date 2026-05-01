import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function WqaQuality() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const lowest = [...pages].sort((a, b) => Number(a.qualityScore) - Number(b.qualityScore)).slice(0, 6)
  const heatCells = useMemo(() => {
    const tpls = [...new Set(pages.map(templateOf))].slice(0, 6)
    const bands = ['Critical', 'Poor', 'Fair', 'Good', 'Excellent']
    const cells: Array<{ x: string; y: string; value: number }> = []
    for (const t of tpls) for (const band of bands) {
      const n = pages.filter(p => templateOf(p) === t && bandOf(Number(p.qualityScore)) === band).length
      cells.push({ y: t, x: band, value: n })
    }
    return { cells, xLabels: bands, yLabels: tpls }
  }, [pages])

  return (
    <div className="space-y-3 p-3">
      <DistRowsBlock title="Thin reasons" rows={[
        { label: '<150 words', value: s.reasons.tinyWord, tone: 'bad' },
        { label: '150–300 words', value: s.reasons.shortWord, tone: 'warn' },
        { label: 'No H1', value: s.reasons.noH1, tone: 'warn' },
        { label: 'Boilerplate-heavy', value: s.reasons.boilerplate, tone: 'warn' },
      ]} />
      <DistBlock title="Quality bands" segments={[
        { value: s.bands.excellent, tone: 'good', label: 'Excellent' },
        { value: s.bands.good, tone: 'good', label: 'Good' },
        { value: s.bands.fair, tone: 'info', label: 'Fair' },
        { value: s.bands.poor, tone: 'warn', label: 'Poor' },
        { value: s.bands.critical, tone: 'bad', label: 'Critical' },
      ]} />
      <TopListBlock title="Lowest quality pages" items={lowest.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: Number(p.qualityScore).toFixed(0), onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By depth" headers={['Depth', 'Pages', 'Avg q', 'Thin']} rows={[
        { id: '0-1', label: '0–1', values: [s.byDepth['0-1']?.n || 0, (s.byDepth['0-1']?.avg || 0).toFixed(0), s.byDepth['0-1']?.thin || 0] },
        { id: '2-3', label: '2–3', values: [s.byDepth['2-3']?.n || 0, (s.byDepth['2-3']?.avg || 0).toFixed(0), s.byDepth['2-3']?.thin || 0] },
        { id: '4-5', label: '4–5', values: [s.byDepth['4-5']?.n || 0, (s.byDepth['4-5']?.avg || 0).toFixed(0), s.byDepth['4-5']?.thin || 0] },
        { id: '6+',  label: '6+',  values: [s.byDepth['6+']?.n  || 0, (s.byDepth['6+']?.avg  || 0).toFixed(0), s.byDepth['6+']?.thin  || 0] },
      ]} />
      <HeatmapBlock title="Template × quality band" cells={heatCells.cells} xLabels={heatCells.xLabels} yLabels={heatCells.yLabels} />
      <DrillFooter chips={[
        { label: 'Thin', count: s.thin },
        { label: 'Dup', count: s.dup },
        { label: 'AI-y', count: s.aiy },
      ]} />
    </div>
  )
}

function bandOf(v: number): string {
  if (v >= 90) return 'Excellent'; if (v >= 75) return 'Good'
  if (v >= 60) return 'Fair';      if (v >= 40) return 'Poor'
  return 'Critical'
}
