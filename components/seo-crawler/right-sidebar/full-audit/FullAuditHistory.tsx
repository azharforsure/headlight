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

export function FullAuditHistory() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  if (!pages?.length) return <EmptyState title="No crawl history yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Crawl outcome mix" segments={[
        { value: s.history.success, tone: 'good', label: 'Success' },
        { value: s.history.partial, tone: 'warn', label: 'Partial' },
        { value: s.history.failed,  tone: 'bad',  label: 'Failed' },
      ]} />
      <TrendBlock title="Score (12 weeks)" values={s.history.scoreSeries} tone="info" />
      <CompareBlock title="This vs last vs 30d avg" rows={[
        { label: 'Score', a: { v: s.score, tag: 'now' }, b: { v: s.scorePrev, tag: 'prev' }, c: { v: s.history.score30dAvg, tag: 'avg' } },
        { label: 'Pages', a: { v: s.total, tag: 'now' }, b: { v: s.history.totalPrev, tag: 'prev' }, c: { v: s.history.total30dAvg, tag: 'avg' } },
        { label: 'Errors', a: { v: s.issues.errors, tag: 'now' }, b: { v: s.issues.errorsPrev, tag: 'prev' }, c: { v: s.history.errors30dAvg, tag: 'avg' } },
      ]} />
      <TimelineBlock title="Recent crawls" entries={s.history.recent.map((c: any) => ({
        id: c.id, ts: c.relTime, title: `${c.score} · ${c.label}`,
        detail: `${c.pages} pages · ${c.errors} errors`,
        tone: c.score >= s.history.score30dAvg ? 'good' : 'warn',
      }))} max={8} />
      <DrillFooter chips={[
        { label: 'Recrawl', onClick: () => {} },
        { label: 'Compare', onClick: () => {} },
        { label: 'Export', onClick: () => {} },
      ]} />
    </div>
  )
}
