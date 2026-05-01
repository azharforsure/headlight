import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function LocalNap() {
  const { locations } = useSeoCrawler() as any
  const s = useLocalInsights()
  if (!locations?.length) return <EmptyState title="No locations set" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Citation status" segments={[
        { value: s.nap.matched, tone: 'good', label: 'Matched' },
        { value: s.nap.partial, tone: 'warn', label: 'Partial' },
        { value: s.nap.mismatched, tone: 'bad', label: 'Mismatched' },
        { value: s.nap.missing, tone: 'neutral', label: 'Missing' },
      ]} />
      <DistRowsBlock title="Field-level match" rows={[
        { label: 'Name', value: fmtPct(s.nap.name * 100), tone: scoreToTone(s.nap.name * 100) },
        { label: 'Address', value: fmtPct(s.nap.address * 100), tone: scoreToTone(s.nap.address * 100) },
        { label: 'Phone', value: fmtPct(s.nap.phone * 100), tone: scoreToTone(s.nap.phone * 100) },
        { label: 'Website', value: fmtPct(s.nap.website * 100), tone: scoreToTone(s.nap.website * 100) },
        { label: 'Hours', value: fmtPct(s.nap.hours * 100), tone: scoreToTone(s.nap.hours * 100) },
      ]} />
      <TopListBlock title="Worst directories" items={s.nap.worstDirectories.slice(0, 6).map((d: any) => ({
        id: d.id, primary: d.name, tail: fmtPct(d.consistency * 100),
      }))} />
      <TopListBlock title="Mismatched listings" items={s.nap.mismatchedList.slice(0, 6).map((l: any) => ({
        id: l.id, primary: l.directory, secondary: l.location, tail: l.field,
      }))} emptyText="No mismatches" />
      <SegmentBlock title="By location" headers={['Location','Citations','Match %','Mismatches']} rows={s.byLocation.slice(0, 6).map((l: any) => ({
        id: l.id, label: l.name, values: [l.citations, fmtPct(l.napConsistency * 100), l.napMismatches],
      }))} />
      <DrillFooter chips={[
        { label: 'Mismatches', count: s.nap.mismatches },
        { label: 'Missing', count: s.nap.missing },
      ]} />
    </div>
  )
}
