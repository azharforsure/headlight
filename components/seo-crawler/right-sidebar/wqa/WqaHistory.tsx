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

export function WqaHistory() {
  const { pages } = useSeoCrawler()
  const s = useWqaInsights()
  if (!pages?.length) return <EmptyState title="No crawl history yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Outcome mix" segments={[
        { value: s.history.success, tone: 'good', label: 'Success' },
        { value: s.history.partial, tone: 'warn', label: 'Partial' },
        { value: s.history.failed,  tone: 'bad',  label: 'Failed' },
      ]} />
      <TrendBlock title="Avg quality (12 weeks)" values={s.qualitySeries} tone="info" />
      <TimelineBlock title="Recent crawls" entries={s.history.recent.map((c: any) => ({
        id: c.id, ts: c.relTime, title: `${c.score} · ${c.label}`,
        detail: `${c.pages} pages · ${c.thin} thin`,
        tone: c.score >= s.history.score30dAvg ? 'good' : 'warn',
      }))} max={8} />
      <CompareBlock title="This vs last vs 30d avg" rows={[
        { label: 'Score', a: { v: s.score, tag: 'now' }, b: { v: s.scorePrev, tag: 'prev' }, c: { v: s.history.score30dAvg, tag: 'avg' } },
        { label: 'Thin', a: { v: s.thin, tag: 'now' }, b: { v: s.thinPrev, tag: 'prev' }, c: { v: s.history.thin30dAvg, tag: 'avg' } },
      ]} />
      <DrillFooter chips={[
        { label: 'Recrawl', onClick: () => {} },
        { label: 'Compare', onClick: () => {} },
      ]} />
    </div>
  )
}
