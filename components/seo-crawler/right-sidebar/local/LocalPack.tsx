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

export function LocalPack() {
  const { locations } = useSeoCrawler() as any
  const s = useLocalInsights()
  if (!locations?.length) return <EmptyState title="No locations set" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Position mix" segments={[
        { value: s.localPack.pos1, tone: 'good', label: '#1' },
        { value: s.localPack.pos2, tone: 'good', label: '#2' },
        { value: s.localPack.pos3, tone: 'info', label: '#3' },
        { value: s.localPack.pos4plus, tone: 'warn', label: '#4+' },
        { value: s.localPack.notRanking, tone: 'bad', label: 'Not ranking' },
      ]} />
      <TrendBlock title="Pack share (90d)" values={s.localPack.shareSeries90d} tone="info" />
      <TopListBlock title="Top local keywords" items={s.localPack.topKeywords.slice(0, 6).map((k: any) => ({
        id: k.id, primary: k.keyword, secondary: `${compactNum(k.volume)} vol`,
        tail: `#${k.position}`,
      }))} />
      <TopListBlock title="Lost local keywords" items={s.localPack.lost.slice(0, 6).map((k: any) => ({
        id: k.id, primary: k.keyword, tail: `#${k.posPrev} → #${k.posNow}`,
      }))} emptyText="No losses" />
      <SegmentBlock title="By location" headers={['Location','Pack share','Top 3','Avg pos']} rows={s.byLocation.slice(0, 6).map((l: any) => ({
        id: l.id, label: l.name, values: [fmtPct(l.localPackShare * 100), l.top3, l.avgPos.toFixed(1)],
      }))} />
      <BenchmarkBlock title="Pack share vs market" site={s.localPack.share * 100} benchmark={s.bench.localPackShare * 100} unit="%" higherIsBetter />
      <DrillFooter chips={[
        { label: 'Top 3', count: s.localPack.top3 },
        { label: 'Lost', count: s.localPack.lost.length },
      ]} />
    </div>
  )
}
