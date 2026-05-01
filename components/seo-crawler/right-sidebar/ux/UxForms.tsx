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

export function UxForms() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Field error type" segments={[
        { value: s.forms.errors.required, tone: 'warn', label: 'Required missed' },
        { value: s.forms.errors.format, tone: 'warn', label: 'Format' },
        { value: s.forms.errors.range, tone: 'info', label: 'Range' },
        { value: s.forms.errors.server, tone: 'bad', label: 'Server' },
      ]} />
      <DistRowsBlock title="Friction signals" rows={[
        { label: 'Field abandon', value: s.forms.fieldAbandon, tone: 'warn' },
        { label: 'Re-submit', value: s.forms.resubmit, tone: 'warn' },
        { label: 'Avg fill time', value: `${s.forms.avgFillSec}s` },
      ]} />
      <TopListBlock title="Worst form fields" items={s.forms.worstFields.slice(0, 6).map((f: any) => ({
        id: f.id, primary: f.label, secondary: f.formName,
        tail: `${fmtPct(f.errorRate * 100)} errors`,
      }))} />
      <TopListBlock title="Top form pages" items={s.forms.byPage.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: fmtPct(p.submitRate * 100),
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By form" headers={['Form','Views','Submits','Submit rate']} rows={s.forms.list.slice(0, 6).map((f: any) => ({
        id: f.id, label: f.name, values: [compactNum(f.views), compactNum(f.submits), fmtPct(f.submitRate * 100)],
      }))} />
      <DrillFooter chips={[
        { label: 'Errors', count: s.forms.totalErrors },
        { label: 'Abandon', count: s.forms.fieldAbandon },
      ]} />
    </div>
  )
}
