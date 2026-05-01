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

export function ContentDuplication() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const exactDup = pages.filter(p => p.exactDuplicate).slice(0, 6)
  const nearDup = pages.filter(p => p.nearDuplicateMatch).slice(0, 6)
  const canonMismatch = pages.filter(p => p.canonicalMismatch).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Dup type mix" segments={[
        { value: s.dup.exact, tone: 'bad', label: 'Exact' },
        { value: s.dup.near, tone: 'warn', label: 'Near' },
        { value: s.dup.canonMismatch, tone: 'warn', label: 'Canonical mismatch' },
        { value: s.dup.titleDup, tone: 'info', label: 'Title dup' },
        { value: s.dup.metaDup, tone: 'info', label: 'Meta dup' },
      ]} />
      <TopListBlock title="Most-duplicated" items={exactDup.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url, tail: 'exact',
        onClick: () => drill.toPage(p),
      }))} emptyText="No exact duplicates" />
      <TopListBlock title="Near duplicates" items={nearDup.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url, tail: 'near',
        onClick: () => drill.toPage(p),
      }))} emptyText="No near duplicates" />
      <TopListBlock title="Canonical mismatch" items={canonMismatch.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.canonicalUrl,
        tail: 'mismatch', onClick: () => drill.toPage(p),
      }))} emptyText="All canonicals match" />
      <DrillFooter chips={[
        { label: 'Exact', count: s.dup.exact }, { label: 'Near', count: s.dup.near },
      ]} />
    </div>
  )
}
