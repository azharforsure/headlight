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

export function TechnicalAccessibility() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worst = [...pages].filter(p => p.a11yScore != null).sort((a, b) => Number(a.a11yScore) - Number(b.a11yScore)).slice(0, 6)
  const heatCells = useMemo(() => {
    const tpls = [...new Set(pages.map(templateOf))].slice(0, 6)
    const rules = ['contrast', 'alt-text', 'aria', 'labels', 'landmarks']
    const cells: Array<{ x: string; y: string; value: number }> = []
    for (const t of tpls) for (const r of rules) {
      const n = (s.a11y.violations.byTemplateRule?.[`${t}::${r}`] || 0)
      cells.push({ y: t, x: r, value: n })
    }
    return { cells, xLabels: rules, yLabels: tpls }
  }, [pages, s])

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Violation type mix" segments={[
        { value: s.a11y.violations.contrast, tone: 'bad', label: 'Contrast' },
        { value: s.a11y.violations.altText, tone: 'warn', label: 'Alt text' },
        { value: s.a11y.violations.aria, tone: 'warn', label: 'ARIA' },
        { value: s.a11y.violations.labels, tone: 'warn', label: 'Labels' },
        { value: s.a11y.violations.landmarks, tone: 'info', label: 'Landmarks' },
      ]} />
      <DistRowsBlock title="WCAG level" rows={[
        { label: 'A', value: s.a11y.levelA, tone: 'bad' },
        { label: 'AA', value: s.a11y.levelAA, tone: 'warn' },
        { label: 'AAA', value: s.a11y.levelAAA, tone: 'info' },
      ]} />
      <TopListBlock title="Worst pages" items={worst.map(p => ({
        id: p.url, primary: p.title || p.url, tail: Number(p.a11yScore).toFixed(0),
        onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Most-violated rules" items={s.a11y.topRules.slice(0, 6).map((r: any) => ({
        id: r.id, primary: r.label, tail: `${r.count} pages`,
        onClick: () => drill.toCategory('a11y', r.id),
      }))} />
      <HeatmapBlock title="Template × rule" cells={heatCells.cells} xLabels={heatCells.xLabels} yLabels={heatCells.yLabels} />
      <DrillFooter chips={[
        { label: 'Errors', count: s.a11y.errors },
        { label: 'Contrast', count: s.a11y.violations.contrast },
      ]} />
    </div>
  )
}
