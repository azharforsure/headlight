import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function SocialEngage() {
  const { socialProfiles } = useSeoCrawler() as any
  const s = useSocialInsights()
  if (!socialProfiles?.length) return <EmptyState title="No social profiles connected" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Post type mix" segments={[
        { value: s.engagement.byType.text, tone: 'info', label: 'Text' },
        { value: s.engagement.byType.image, tone: 'good', label: 'Image' },
        { value: s.engagement.byType.video, tone: 'good', label: 'Video' },
        { value: s.engagement.byType.link, tone: 'info', label: 'Link' },
      ]} />
      <DistRowsBlock title="Engagement signal" rows={[
        { label: 'Likes', value: compactNum(s.engagement.signals.likes) },
        { label: 'Comments', value: compactNum(s.engagement.signals.comments) },
        { label: 'Shares', value: compactNum(s.engagement.signals.shares) },
        { label: 'Saves', value: compactNum(s.engagement.signals.saves) },
      ]} />
      <TrendBlock title="Engagement rate (12 weeks)" values={s.engagement.rateSeries} tone="info" />
      <TopListBlock title="Top-performing posts" items={s.engagement.topPosts.slice(0, 6).map((p: any) => ({
        id: p.id, primary: p.text.slice(0, 80), secondary: `${p.channel} · ${p.relTime}`,
        tail: compactNum(p.engagement),
      }))} />
      <TopListBlock title="Worst-performing posts" items={s.engagement.worstPosts.slice(0, 6).map((p: any) => ({
        id: p.id, primary: p.text.slice(0, 80), secondary: p.channel,
        tail: compactNum(p.engagement),
      }))} />
      <BenchmarkBlock title="Engagement vs vertical" site={s.engagement.rate * 100} benchmark={s.bench.engagement * 100} unit="%" higherIsBetter />
      <DrillFooter chips={[
        { label: 'Posts', count: s.engagement.posts30d },
        { label: 'Top format', count: s.engagement.topFormat },
      ]} />
    </div>
  )
}
