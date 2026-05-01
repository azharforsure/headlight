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

export function LocalGbp() {
  const { gbpProfiles } = useSeoCrawler() as any
  const s = useLocalInsights()
  if (!gbpProfiles?.length) return <EmptyState title="No GBP connected" />

  return (
    <div className="space-y-3 p-3">
      <DistRowsBlock title="Field coverage" rows={[
        { label: 'Hours', value: fmtPct(s.gbp.fields.hours * 100), tone: scoreToTone(s.gbp.fields.hours * 100) },
        { label: 'Categories', value: fmtPct(s.gbp.fields.categories * 100), tone: scoreToTone(s.gbp.fields.categories * 100) },
        { label: 'Description', value: fmtPct(s.gbp.fields.description * 100), tone: scoreToTone(s.gbp.fields.description * 100) },
        { label: 'Photos', value: fmtPct(s.gbp.fields.photos * 100), tone: scoreToTone(s.gbp.fields.photos * 100) },
        { label: 'Services', value: fmtPct(s.gbp.fields.services * 100), tone: scoreToTone(s.gbp.fields.services * 100) },
      ]} />
      <DistBlock title="Post cadence" segments={[
        { value: s.gbp.postCadence.weekly, tone: 'good', label: 'Weekly+' },
        { value: s.gbp.postCadence.monthly, tone: 'info', label: 'Monthly' },
        { value: s.gbp.postCadence.quarterly, tone: 'warn', label: 'Quarterly' },
        { value: s.gbp.postCadence.never, tone: 'bad', label: 'Never' },
      ]} />
      <TrendBlock title="Profile views (90d)" values={s.gbp.viewsSeries} tone="info" />
      <TopListBlock title="Worst profiles" items={s.gbp.worstProfiles.slice(0, 6).map((p: any) => ({
        id: p.id, primary: p.name, secondary: p.address, tail: p.score.toFixed(0),
      }))} />
      <TopListBlock title="Best profiles" items={s.gbp.bestProfiles.slice(0, 6).map((p: any) => ({
        id: p.id, primary: p.name, tail: p.score.toFixed(0),
      }))} />
      <SegmentBlock title="By location" headers={['Location','Score','Photos','Posts']} rows={s.byLocation.slice(0, 6).map((l: any) => ({
        id: l.id, label: l.name, values: [l.gbpScore.toFixed(0), l.photos, l.posts30d],
      }))} />
      <DrillFooter chips={[
        { label: 'Q&A', count: s.gbp.unansweredQA },
        { label: 'Field gaps', count: s.gbp.fieldGaps },
      ]} />
    </div>
  )
}
