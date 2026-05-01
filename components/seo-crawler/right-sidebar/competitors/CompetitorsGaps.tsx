import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function CompetitorsGaps() {
  const { competitors } = useSeoCrawler() as any
  const s = useCompetitorsInsights()
  const drill = useDrill()
  if (!competitors?.length) return <EmptyState title="No competitors set" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Gap type" segments={[
        { value: s.gaps.keywords, tone: 'info', label: 'Keyword' },
        { value: s.gaps.content, tone: 'warn', label: 'Content' },
        { value: s.gaps.links, tone: 'warn', label: 'Links' },
        { value: s.gaps.technical, tone: 'info', label: 'Technical' },
      ]} />
      <DistRowsBlock title="Difficulty mix" rows={[
        { label: 'Easy (KD < 30)', value: s.gaps.byKd.easy, tone: 'good' },
        { label: 'Medium', value: s.gaps.byKd.medium, tone: 'info' },
        { label: 'Hard (KD > 70)', value: s.gaps.byKd.hard, tone: 'warn' },
      ]} />
      <TopListBlock title="High-value keyword gaps" items={s.gaps.topKeywords.slice(0, 6).map((k: any) => ({
        id: k.id, primary: k.keyword, secondary: `KD ${k.kd} · ${k.competitorRanking}`,
        tail: `${compactNum(k.volume)} vol`,
      }))} />
      <TopListBlock title="Content topic gaps" items={s.gaps.topTopics.slice(0, 6).map((t: any) => ({
        id: t.id, primary: t.label, tail: `${t.competitorPages} pages`,
      }))} />
      <SegmentBlock title="By competitor" headers={['Competitor','Keyword gaps','Content gaps','Link gaps']} rows={s.byCompetitor.filter((c: any) => !c.isYou).slice(0, 6).map((c: any) => ({
        id: c.id, label: c.domain, values: [compactNum(c.gapKeywords), c.gapContent, c.gapLinks],
      }))} />
      <DrillFooter chips={[
        { label: 'Easy gaps', count: s.gaps.byKd.easy },
        { label: 'Top topics', count: s.gaps.topTopics.length },
      ]} />
    </div>
  )
}
