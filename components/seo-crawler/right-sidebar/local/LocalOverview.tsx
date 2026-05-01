import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'

export function LocalOverview() {
  const { locations } = useSeoCrawler() as any
  const s = useLocalInsights()
  if (!locations?.length) return <EmptyState title="No locations set" hint="Connect Google Business Profile." />

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Local"
        scoreHint="NAP + GBP + reviews + local pack"
        kpis={[
          { label: 'Locations', value: locations?.length || 0 },
          { label: 'NAP consistent', value: fmtPct(s.nap.consistency * 100), tone: scoreToTone(s.nap.consistency * 100) },
          { label: 'GBP avg score', value: s.gbp.avgScore.toFixed(0), tone: scoreToTone(s.gbp.avgScore) },
        ]} />
      <DistBlock title="Location health" segments={[
        { value: s.bands.healthy, tone: 'good', label: 'Healthy' },
        { value: s.bands.atRisk, tone: 'warn', label: 'At risk' },
        { value: s.bands.broken, tone: 'bad', label: 'Broken' },
      ]} />
      <DistRowsBlock title="NAP signals" rows={[
        { label: 'Name match', value: fmtPct(s.nap.name * 100), tone: scoreToTone(s.nap.name * 100) },
        { label: 'Address match', value: fmtPct(s.nap.address * 100), tone: scoreToTone(s.nap.address * 100) },
        { label: 'Phone match', value: fmtPct(s.nap.phone * 100), tone: scoreToTone(s.nap.phone * 100) },
        { label: 'Hours match', value: fmtPct(s.nap.hours * 100), tone: scoreToTone(s.nap.hours * 100) },
      ]} />
      <TrendBlock title="Local pack share (12 weeks)" values={s.localPack.shareSeries} tone="info" />
      <TopListBlock title="Top locations by visibility" items={s.byLocation.slice(0, 6).map((l: any) => ({
        id: l.id, primary: l.name, secondary: l.address,
        tail: fmtPct(l.localVisibility * 100),
      }))} />
      <SegmentBlock title="By location" headers={['Location','GBP','NAP %','Reviews']} rows={s.byLocation.slice(0, 6).map((l: any) => ({
        id: l.id, label: l.name,
        values: [l.gbpScore.toFixed(0), fmtPct(l.napConsistency * 100), `${l.reviewCount} · ${l.avgRating.toFixed(1)}★`],
      }))} />
      <BenchmarkBlock title="Local pack share vs market" site={s.localPack.share * 100} benchmark={s.bench.localPackShare * 100} unit="%" higherIsBetter />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Local pack share', a: { v: s.localPack.share * 100, tag: 'now' }, b: { v: s.localPack.sharePrev * 100, tag: 'prev' }, format: fmtPct },
        { label: 'Reviews (30d)', a: { v: s.reviews.new30d, tag: 'now' }, b: { v: s.reviews.new30dPrev, tag: 'prev' } },
      ]} />

      <DrillFooter chips={[
        { label: 'NAP issues', count: s.nap.issues },
        { label: 'GBP issues', count: s.gbp.issues },
        { label: 'Reviews', count: s.reviews.total },
        { label: 'Local pack', count: fmtPct(s.localPack.share * 100) },
      ]} />
    </div>
  )
}
